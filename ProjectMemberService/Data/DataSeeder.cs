using Microsoft.EntityFrameworkCore;
using ProjectMemberService.Models;

namespace ProjectMemberService.Data
{
    public static class DataSeeder
    {
        public static void Seed(ProjectDbContext context)
        {
            // Seed 5 projects from project_db.sql if they don't exist
            var proj1Id = new Guid("A0E64669-7A8B-4B2D-8C54-7278EEAD8E1A");
            if (context.Projects.Any(p => p.Id == proj1Id))
            {
                return; // already seeded
            }

            // --- 1. PROJECTS ---
            var projects = new List<Project>
            {
                new Project
                {
                    Id = proj1Id,
                    Name = "Hệ thống E-Commerce Bán hàng Trực tuyến",
                    Description = "Dự án phát triển nền tảng mua sắm trực tuyến tích hợp cổng thanh toán vnpay.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 5, 1), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 12, 31), DateTimeKind.Utc),
                    Color = "#FF5733",
                    Status = ProjectStatus.Active,
                    CreatedBy = "owner_user_1",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Project
                {
                    Id = new Guid("B7E235C1-2856-4EE6-9310-47F15A36A9D9"),
                    Name = "Website Tuyển dụng & Tìm kiếm Việc làm",
                    Description = "Nền tảng giúp kết nối nhà tuyển dụng công nghệ với các lập trình viên.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 6, 1), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 10, 30), DateTimeKind.Utc),
                    Color = "#33FF57",
                    Status = ProjectStatus.Active,
                    CreatedBy = "owner_user_2",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Project
                {
                    Id = new Guid("C5FA8E62-F4A3-4C3D-8822-2616D713E22F"),
                    Name = "Ứng dụng Di động Theo dõi Sức khỏe",
                    Description = "App di động đếm bước chân, tính lượng calo và gợi ý chế độ ăn uống lành mạnh.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 5, 15), DateTimeKind.Utc),
                    EndDate = null,
                    Color = "#3357FF",
                    Status = ProjectStatus.Active,
                    CreatedBy = "owner_user_3",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Project
                {
                    Id = new Guid("D3C4A5E7-6B18-479D-A3D3-524C281F1A7E"),
                    Name = "Hệ thống CRM Quản lý Quan hệ Khách hàng",
                    Description = "Phần mềm chăm sóc khách hàng và tối ưu quy trình bán hàng doanh nghiệp.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 4, 1), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 9, 1), DateTimeKind.Utc),
                    Color = "#F0B27A",
                    Status = ProjectStatus.Active,
                    CreatedBy = "owner_user_4",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Project
                {
                    Id = new Guid("E9F8E7D6-C5B4-4321-A9D8-654C281F1D4C"),
                    Name = "Nền tảng Học trực tuyến E-Learning",
                    Description = "Hệ thống quản lý khóa học video, livestream dạy học trực tuyến và làm bài thi.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 6, 10), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2027, 3, 31), DateTimeKind.Utc),
                    Color = "#8E44AD",
                    Status = ProjectStatus.Active,
                    CreatedBy = "owner_user_5",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Projects.AddRange(projects);
            context.SaveChanges();

            // --- 2. PROJECT MEMBERS ---
            var members = new List<ProjectMember>
            {
                // Project 1
                new ProjectMember { ProjectId = proj1Id, UserId = "owner_user_1", DisplayName = "Nguyễn Văn A", Email = "owner1@example.com", Role = MemberRole.Owner, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = proj1Id, UserId = "manager_user_1", DisplayName = "Trần Thị B", Email = "manager1@example.com", Role = MemberRole.Manager, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = proj1Id, UserId = "dev_user_1", DisplayName = "Lê Văn C", Email = "dev1@example.com", Role = MemberRole.Member, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = proj1Id, UserId = "dev_user_2", DisplayName = "Phạm Văn D", Email = "dev2@example.com", Role = MemberRole.Member, JoinedAt = DateTime.UtcNow },

                // Project 2
                new ProjectMember { ProjectId = new Guid("B7E235C1-2856-4EE6-9310-47F15A36A9D9"), UserId = "owner_user_2", DisplayName = "Đỗ Minh Quân", Email = "owner2@example.com", Role = MemberRole.Owner, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = new Guid("B7E235C1-2856-4EE6-9310-47F15A36A9D9"), UserId = "dev_user_3", DisplayName = "Nguyễn Hoàng Nam", Email = "dev3@example.com", Role = MemberRole.Member, JoinedAt = DateTime.UtcNow },

                // Project 3
                new ProjectMember { ProjectId = new Guid("C5FA8E62-F4A3-4C3D-8822-2616D713E22F"), UserId = "owner_user_3", DisplayName = "Phan Thanh Hằng", Email = "owner3@example.com", Role = MemberRole.Owner, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = new Guid("C5FA8E62-F4A3-4C3D-8822-2616D713E22F"), UserId = "manager_user_2", DisplayName = "Hoàng Gia Bảo", Email = "manager2@example.com", Role = MemberRole.Manager, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = new Guid("C5FA8E62-F4A3-4C3D-8822-2616D713E22F"), UserId = "dev_user_4", DisplayName = "Lê Minh Triết", Email = "dev4@example.com", Role = MemberRole.Member, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = new Guid("C5FA8E62-F4A3-4C3D-8822-2616D713E22F"), UserId = "viewer_user_1", DisplayName = "Trương Mỹ Linh", Email = "viewer1@example.com", Role = MemberRole.Viewer, JoinedAt = DateTime.UtcNow },

                // Project 4
                new ProjectMember { ProjectId = new Guid("D3C4A5E7-6B18-479D-A3D3-524C281F1A7E"), UserId = "owner_user_4", DisplayName = "Vũ Hoàng Nam", Email = "owner4@example.com", Role = MemberRole.Owner, JoinedAt = DateTime.UtcNow },

                // Project 5
                new ProjectMember { ProjectId = new Guid("E9F8E7D6-C5B4-4321-A9D8-654C281F1D4C"), UserId = "owner_user_5", DisplayName = "Lý Khánh Hòa", Email = "owner5@example.com", Role = MemberRole.Owner, JoinedAt = DateTime.UtcNow },
                new ProjectMember { ProjectId = new Guid("E9F8E7D6-C5B4-4321-A9D8-654C281F1D4C"), UserId = "dev_user_5", DisplayName = "Ngô Gia Huy", Email = "dev5@example.com", Role = MemberRole.Member, JoinedAt = DateTime.UtcNow }
            };

            context.ProjectMembers.AddRange(members);
            context.SaveChanges();

            // --- 3. SPRINTS ---
            var sprints = new List<Sprint>
            {
                // Project 1
                new Sprint
                {
                    ProjectId = proj1Id,
                    Name = "Sprint 1: Thiết kế cơ sở dữ liệu & API Đăng ký/Đăng nhập",
                    Goal = "Hoàn thành thiết kế thực thể DB và các API Auth cơ bản.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 5, 1), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 5, 15), DateTimeKind.Utc),
                    Status = SprintStatus.Completed,
                    CreatedAt = DateTime.UtcNow
                },
                new Sprint
                {
                    ProjectId = proj1Id,
                    Name = "Sprint 2: Phát triển giỏ hàng & Cổng thanh toán",
                    Goal = "Hoàn thiện luồng checkout và tích hợp API VnPay.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 6, 10), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 6, 24), DateTimeKind.Utc),
                    Status = SprintStatus.Active,
                    CreatedAt = DateTime.UtcNow
                },

                // Project 2
                new Sprint
                {
                    ProjectId = new Guid("B7E235C1-2856-4EE6-9310-47F15A36A9D9"),
                    Name = "Sprint 1: Phát triển bộ tìm kiếm và bộ lọc việc làm",
                    Goal = "Hoàn thành API ElasticSearch và UI tìm kiếm nâng cao.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 6, 12), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 6, 26), DateTimeKind.Utc),
                    Status = SprintStatus.Active,
                    CreatedAt = DateTime.UtcNow
                },

                // Project 3
                new Sprint
                {
                    ProjectId = new Guid("C5FA8E62-F4A3-4C3D-8822-2616D713E22F"),
                    Name = "Sprint 1: Kết nối thiết bị qua Bluetooth",
                    Goal = "Tích hợp SDK đọc dữ liệu nhịp tim và bước chân.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 6, 20), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 7, 4), DateTimeKind.Utc),
                    Status = SprintStatus.Planning,
                    CreatedAt = DateTime.UtcNow
                },

                // Project 4
                new Sprint
                {
                    ProjectId = new Guid("D3C4A5E7-6B18-479D-A3D3-524C281F1A7E"),
                    Name = "Sprint 1: Quản lý khách hàng tiềm năng (Leads)",
                    Goal = "Cho phép tạo, cập nhật trạng thái và gán lead cho nhân viên sales.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 6, 5), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 6, 19), DateTimeKind.Utc),
                    Status = SprintStatus.Active,
                    CreatedAt = DateTime.UtcNow
                },

                // Project 5
                new Sprint
                {
                    ProjectId = new Guid("E9F8E7D6-C5B4-4321-A9D8-654C281F1D4C"),
                    Name = "Sprint 1: Tải lên và Stream video bài giảng",
                    Goal = "Xây dựng luồng tải lên video lên cloud và xem video với chất lượng HD.",
                    StartDate = DateTime.SpecifyKind(new DateTime(2026, 6, 15), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 6, 29), DateTimeKind.Utc),
                    Status = SprintStatus.Planning,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Sprints.AddRange(sprints);
            context.SaveChanges();

            // --- 4. MILESTONES ---
            var milestones = new List<Milestone>
            {
                new Milestone { ProjectId = proj1Id, Title = "Hoàn thành MVP v1.0", Description = "Bàn giao phiên bản thử nghiệm có thể mua hàng cơ bản cho khách hàng.", DueDate = DateTime.SpecifyKind(new DateTime(2026, 7, 15), DateTimeKind.Utc), IsCompleted = false, CreatedAt = DateTime.UtcNow },
                new Milestone { ProjectId = new Guid("B7E235C1-2856-4EE6-9310-47F15A36A9D9"), Title = "Bàn giao UI/UX Prototype", Description = "Khách hàng phê duyệt bản thiết kế UI/UX trên Figma trước khi bắt đầu lập trình giao diện.", DueDate = DateTime.SpecifyKind(new DateTime(2026, 6, 5), DateTimeKind.Utc), IsCompleted = true, CreatedAt = DateTime.UtcNow },
                new Milestone { ProjectId = new Guid("C5FA8E62-F4A3-4C3D-8822-2616D713E22F"), Title = "Kiểm thử Beta nội bộ", Description = "Phát hành bản beta thử nghiệm nội bộ cho nhóm 50 nhân viên công ty.", DueDate = DateTime.SpecifyKind(new DateTime(2026, 8, 1), DateTimeKind.Utc), IsCompleted = false, CreatedAt = DateTime.UtcNow },
                new Milestone { ProjectId = new Guid("D3C4A5E7-6B18-479D-A3D3-524C281F1A7E"), Title = "Tích hợp tổng đài ảo IP", Description = "Cho phép nhân viên gọi điện trực tiếp cho khách hàng từ giao diện CRM.", DueDate = DateTime.SpecifyKind(new DateTime(2026, 7, 30), DateTimeKind.Utc), IsCompleted = false, CreatedAt = DateTime.UtcNow },
                new Milestone { ProjectId = new Guid("E9F8E7D6-C5B4-4321-A9D8-654C281F1D4C"), Title = "Ra mắt chương trình học đầu tiên", Description = "Chuẩn bị đủ 10 khóa học chất lượng cao để chính thức mở cổng đăng ký học viên.", DueDate = DateTime.SpecifyKind(new DateTime(2026, 9, 15), DateTimeKind.Utc), IsCompleted = false, CreatedAt = DateTime.UtcNow }
            };

            context.Milestones.AddRange(milestones);
            context.SaveChanges();
        }
    }
}
