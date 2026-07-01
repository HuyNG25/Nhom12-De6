using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace ProjectMemberService.Services
{
    public static class UserGuidMapper
    {
        private static readonly Dictionary<Guid, string> GuidToUsernameMap = new Dictionary<Guid, string>();
        private static readonly Dictionary<string, Guid> UsernameToGuidMap = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);

        static UserGuidMapper()
        {
            // Register explicit/custom mappings
            RegisterMapping("admin", Guid.Parse("a1b2c3d4-0001-0001-0001-000000000001"));
            RegisterMapping("duymanh", Guid.Parse("a1b2c3d4-0001-0001-0001-000000000002"));
            RegisterMapping("tranailinh", Guid.Parse("a1b2c3d4-0001-0001-0001-000000000003"));

            // Register standard MD5 mappings for all testing users
            var list = new[]
            {
                "owner_1", "owner_user_1", "manager_user_1", "dev_user_1", "dev_user_2",
                "owner_user_2", "dev_user_3", "owner_user_3", "manager_user_2", "dev_user_4",
                "viewer_user_1", "owner_user_4", "owner_user_5", "dev_user_5",
                "manager_2", "manager_3", "manager_4", "manager_5", "manager_6",
                "member_2", "member_3", "member_4", "member_5", "member_6", "member_7",
                "viewer_1", "viewer_2", "viewer_3", "viewer_4", "viewer_5", "viewer_6"
            };

            foreach (var username in list)
            {
                using (var md5 = MD5.Create())
                {
                    byte[] hash = md5.ComputeHash(Encoding.UTF8.GetBytes(username.ToLowerInvariant()));
                    var guid = new Guid(hash);
                    RegisterMapping(username, guid);
                }
            }
        }

        private static void RegisterMapping(string username, Guid guid)
        {
            if (!UsernameToGuidMap.ContainsKey(username))
            {
                UsernameToGuidMap[username] = guid;
            }
            if (!GuidToUsernameMap.ContainsKey(guid))
            {
                GuidToUsernameMap[guid] = username;
            }
        }

        public static Guid ToGuid(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Guid.Empty;
            }

            if (Guid.TryParse(userId, out var guid))
            {
                return guid;
            }

            var lower = userId.ToLowerInvariant();
            if (UsernameToGuidMap.TryGetValue(lower, out var g))
            {
                return g;
            }

            using (var md5 = MD5.Create())
            {
                byte[] hash = md5.ComputeHash(Encoding.UTF8.GetBytes(lower));
                return new Guid(hash);
            }
        }

        public static string ToUsername(string? userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return "anonymous";
            }

            if (Guid.TryParse(userId, out var guid))
            {
                if (GuidToUsernameMap.TryGetValue(guid, out var username))
                {
                    return username;
                }
                return userId; // Fallback to raw Guid string if no mapping exists
            }

            return userId; // Already a username string
        }
    }
}
