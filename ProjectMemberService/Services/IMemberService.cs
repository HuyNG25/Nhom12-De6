using ProjectMemberService.DTOs;

namespace ProjectMemberService.Services
{
    public interface IMemberService
    {
        Task<ApiResponse<MemberResponseDto>> AddMemberAsync(Guid projectId, AddMemberDto dto, string operatorUserId);
        Task<ApiResponse<List<MemberResponseDto>>> GetMembersAsync(Guid projectId, string userId);
        Task<ApiResponse<MemberResponseDto>> UpdateRoleAsync(Guid projectId, Guid memberId, UpdateMemberRoleDto dto, string operatorUserId);
        Task<ApiResponse<bool>> RemoveMemberAsync(Guid projectId, Guid memberId, string operatorUserId);
    }
}
