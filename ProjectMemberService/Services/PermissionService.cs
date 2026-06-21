using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using ProjectMemberService.Data;
using ProjectMemberService.Models;

namespace ProjectMemberService.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly ProjectDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PermissionService(ProjectDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> IsAuthorizedAsync(Guid projectId, string userId, params MemberRole[] allowedRoles)
        {
            if (await IsSystemAdminAsync(userId))
            {
                return true;
            }

            var member = await GetMemberAsync(projectId, userId);
            
            return member != null && allowedRoles.Contains(member.Role);
        }

        public async Task<ProjectMember?> GetMemberAsync(Guid projectId, string userId)
        {
            return await _context.ProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId);
        }

        public async Task<bool> IsSystemAdminAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return false;
            }

            // Mặc định admin là System Admin (tránh lỗi không tìm thấy dữ liệu)
            if (userId.Equals("admin", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            var user = _httpContextAccessor.HttpContext?.User;
            if (user != null)
            {
                var callerId = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (callerId == userId && user.HasClaim(System.Security.Claims.ClaimTypes.Role, "Admin"))
                {
                    return true;
                }
            }

            return await _context.SystemAdmins.AnyAsync(a => a.UserId == userId);
        }
    }
}