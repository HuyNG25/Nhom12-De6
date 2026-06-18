using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ProjectMemberService.DTOs;

namespace ProjectMemberService.Services
{
    public interface IMilestoneService
    {
        Task<ApiResponse<MilestoneResponseDto>> CreateAsync(Guid projectId, CreateMilestoneDto dto, string operatorUserId);
        Task<ApiResponse<List<MilestoneResponseDto>>> GetAllAsync(Guid projectId, string userId);
        Task<ApiResponse<MilestoneResponseDto>> GetByIdAsync(Guid projectId, Guid milestoneId, string userId);
        Task<ApiResponse<MilestoneResponseDto>> UpdateAsync(Guid projectId, Guid milestoneId, UpdateMilestoneDto dto, string operatorUserId);
        Task<ApiResponse<bool>> DeleteAsync(Guid projectId, Guid milestoneId, string operatorUserId);
    }
}
