using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectMemberService.Data;

namespace ProjectMemberService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class SystemUsersController : ControllerBase
    {
        private readonly ProjectDbContext _context;

        public SystemUsersController(ProjectDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllUsers()
        {
            // 3 member mặc định của hệ thống
            var defaultUsers = new List<dynamic>
            {
                new { id = "admin", name = "Nguyễn Văn Admin", email = "admin@gmail.com", role = "Admin" },
                new { id = "duymanh", name = "Nguyễn Duy Mạnh", email = "manh.nguyen@gmail.com", role = "User" },
                new { id = "tranailinh", name = "Trần Ái Linh", email = "linh.tran@gmail.com", role = "User" }
            };

            // Lấy danh sách người dùng độc nhất từ db của hệ thống N1
            var dbUsers = await _context.ProjectMembers
                .Select(x => new { id = x.UserId, name = x.DisplayName, email = x.Email, role = "User" })
                .Distinct()
                .ToListAsync();

            // Kết hợp default users với db users (lọc trùng lặp)
            var result = new List<dynamic>(defaultUsers);
            foreach (var dbUser in dbUsers)
            {
                if (dbUser.id != "admin" && dbUser.id != "duymanh" && dbUser.id != "tranailinh")
                {
                    result.Add(dbUser);
                }
            }

            return Ok(result);
        }
    }
}
