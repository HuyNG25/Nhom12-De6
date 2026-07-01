using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectMemberService.Data;
using ProjectMemberService.DTOs;
using ProjectMemberService.Models;
using ProjectMemberService.Services;

namespace ProjectMemberService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PermissionsController : ControllerBase
    {
        private readonly ProjectDbContext _context;
        private readonly IPermissionService _permissionService;

        public PermissionsController(ProjectDbContext context, IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        private string GetUserId()
        {
            var rawId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                ?? Request.Headers["X-User-Id"].FirstOrDefault() 
                ?? "anonymous";
            return UserGuidMapper.ToUsername(rawId);
        }

        /// <summary>
        /// Lấy danh sách phân quyền hệ thống (theo dạng ảnh 2)
        /// </summary>
        [HttpGet("SystemRoles")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult GetSystemRoles()
        {
            var defaultUsers = new List<dynamic>
            {
                new { 
                    stt = 1, 
                    username = "admin", 
                    email = "admin@gmail.com", 
                    fullName = "Nguyễn Văn Admin", 
                    systemRole = "Admin", 
                    commonPassword = "Password123" 
                },
                new { 
                    stt = 2, 
                    username = "duymanh", 
                    email = "manh.nguyen@gmail.com", 
                    fullName = "Nguyễn Duy Mạnh", 
                    systemRole = "User", 
                    commonPassword = "Password123" 
                },
                new { 
                    stt = 3, 
                    username = "tranailinh", 
                    email = "linh.tran@gmail.com", 
                    fullName = "Trần Ái Linh", 
                    systemRole = "User", 
                    commonPassword = "Password123" 
                }
            };
            
            return Ok(defaultUsers);
        }
    }
}
