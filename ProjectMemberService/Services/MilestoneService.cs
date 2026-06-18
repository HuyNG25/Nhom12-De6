using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectMemberService.Data;
using ProjectMemberService.DTOs;
using ProjectMemberService.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectMemberService.Services
{
    public class MilestoneService : IMilestoneService
    {
        private readonly ProjectDbContext _context;
        private readonly ILogger<MilestoneService> _logger;
        private readonly IPermissionService _permissionService;

        public MilestoneService(ProjectDbContext context, ILogger<MilestoneService> _logger, IPermissionService permissionService)
        {
            _context = context;
            this._logger = _logger;
            _permissionService = permissionService;
        }


        public async Task<ApiResponse<MilestoneResponseDto>> CreateAsync(Guid projectId, CreateMilestoneDto dto, string operatorUserId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Không tìm thấy dự án");
            }

            // Kiểm tra quyền của người thực hiện
            var isAuthorized = await _permissionService.IsAuthorizedAsync(projectId, operatorUserId, MemberRole.Owner, MemberRole.Manager);
            if (!isAuthorized)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Bạn không có quyền quản lý milestone trong dự án này");
            }


            // Kiểm tra DueDate phải sau ngày bắt đầu dự án
            if (dto.DueDate < project.StartDate)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Ngày hạn milestone không được trước ngày bắt đầu dự án");
            }

            // Kiểm tra DueDate phải trước ngày kết thúc dự án (nếu có)
            if (project.EndDate.HasValue && dto.DueDate > project.EndDate.Value)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Ngày hạn milestone không được sau ngày kết thúc dự án");
            }

            var milestone = new Milestone
            {
                ProjectId = projectId,
                Title = dto.Title,
                Description = dto.Description,
                DueDate = dto.DueDate,
                IsCompleted = false
            };

            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Milestone '{Title}' created for project {ProjectId}", milestone.Title, projectId);

            return ApiResponse<MilestoneResponseDto>.Ok(MapToResponse(milestone), "Tạo milestone thành công");
        }

        public async Task<ApiResponse<List<MilestoneResponseDto>>> GetAllAsync(Guid projectId, string userId)
        {
            var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId);
            if (!projectExists)
            {
                return ApiResponse<List<MilestoneResponseDto>>.Fail("Không tìm thấy dự án");
            }

            var isAuthorized = await _permissionService.IsAuthorizedAsync(projectId, userId, MemberRole.Owner, MemberRole.Manager, MemberRole.Member, MemberRole.Viewer);
            if (!isAuthorized)
            {
                return ApiResponse<List<MilestoneResponseDto>>.Fail("Bạn không có quyền xem danh sách milestone của dự án này");
            }

            var milestones = await _context.Milestones
                .Where(m => m.ProjectId == projectId)
                .OrderBy(m => m.DueDate)
                .ToListAsync();

            var result = milestones.Select(MapToResponse).ToList();
            return ApiResponse<List<MilestoneResponseDto>>.Ok(result);
        }

        public async Task<ApiResponse<MilestoneResponseDto>> GetByIdAsync(Guid projectId, Guid milestoneId, string userId)
        {
            var milestone = await _context.Milestones
                .FirstOrDefaultAsync(m => m.Id == milestoneId && m.ProjectId == projectId);

            if (milestone == null)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Không tìm thấy milestone");
            }

            var isAuthorized = await _permissionService.IsAuthorizedAsync(projectId, userId, MemberRole.Owner, MemberRole.Manager, MemberRole.Member, MemberRole.Viewer);
            if (!isAuthorized)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Bạn không có quyền xem thông tin milestone này");
            }

            return ApiResponse<MilestoneResponseDto>.Ok(MapToResponse(milestone));
        }

        public async Task<ApiResponse<MilestoneResponseDto>> UpdateAsync(Guid projectId, Guid milestoneId, UpdateMilestoneDto dto, string operatorUserId)
        {
            var milestone = await _context.Milestones
                .Include(m => m.Project)
                .FirstOrDefaultAsync(m => m.Id == milestoneId && m.ProjectId == projectId);

            if (milestone == null)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Không tìm thấy milestone");
            }

            // Kiểm tra quyền của người thực hiện
            var isAuthorized = await _permissionService.IsAuthorizedAsync(projectId, operatorUserId, MemberRole.Owner, MemberRole.Manager);
            if (!isAuthorized)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Bạn không có quyền quản lý milestone trong dự án này");
            }


            // Kiểm tra DueDate phải sau ngày bắt đầu dự án
            if (dto.DueDate < milestone.Project.StartDate)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Ngày hạn milestone không được trước ngày bắt đầu dự án");
            }

            // Kiểm tra DueDate phải trước ngày kết thúc dự án (nếu có)
            if (milestone.Project.EndDate.HasValue && dto.DueDate > milestone.Project.EndDate.Value)
            {
                return ApiResponse<MilestoneResponseDto>.Fail("Ngày hạn milestone không được sau ngày kết thúc dự án");
            }

            milestone.Title = dto.Title;
            milestone.Description = dto.Description;
            milestone.DueDate = dto.DueDate;
            milestone.IsCompleted = dto.IsCompleted;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Milestone '{Title}' updated in project {ProjectId}", milestone.Title, projectId);

            return ApiResponse<MilestoneResponseDto>.Ok(MapToResponse(milestone), "Cập nhật milestone thành công");
        }

        public async Task<ApiResponse<bool>> DeleteAsync(Guid projectId, Guid milestoneId, string operatorUserId)
        {
            var milestone = await _context.Milestones
                .FirstOrDefaultAsync(m => m.Id == milestoneId && m.ProjectId == projectId);

            if (milestone == null)
            {
                return ApiResponse<bool>.Fail("Không tìm thấy milestone");
            }

            // Kiểm tra quyền của người thực hiện
            var isAuthorized = await _permissionService.IsAuthorizedAsync(projectId, operatorUserId, MemberRole.Owner, MemberRole.Manager);
            if (!isAuthorized)
            {
                return ApiResponse<bool>.Fail("Bạn không có quyền quản lý milestone trong dự án này");
            }


            _context.Milestones.Remove(milestone);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Milestone '{Title}' deleted from project {ProjectId}", milestone.Title, projectId);

            return ApiResponse<bool>.Ok(true, "Xóa milestone thành công");
        }

        private static MilestoneResponseDto MapToResponse(Milestone milestone)
        {
            return new MilestoneResponseDto
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                Title = milestone.Title,
                Description = milestone.Description,
                DueDate = milestone.DueDate,
                IsCompleted = milestone.IsCompleted,
                CreatedAt = milestone.CreatedAt
            };
        }
    }
}
