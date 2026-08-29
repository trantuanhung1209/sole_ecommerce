package www.modules.rbac;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import www.modules.rbac.model.RolePermission;
import www.modules.rbac.repository.AuditLogRepository;
import www.modules.rbac.repository.PermissionRepository;
import www.modules.rbac.repository.RolePermissionRepository;
import www.modules.rbac.repository.RoleRepository;
import www.modules.rbac.service.PermissionCacheService;
import www.modules.rbac.service.RbacService;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RbacServiceTest {

    @Mock private RoleRepository roleRepository;
    @Mock private PermissionRepository permissionRepository;
    @Mock private RolePermissionRepository rolePermissionRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private PermissionCacheService permissionCacheService;

    @InjectMocks
    private RbacService rbacService;

    @Test
    void hasPermission_superAdminAlwaysHasAll() {
        when(permissionCacheService.getCached("SUPER_ADMIN")).thenReturn(null);
        List<String> result = rbacService.permissionsForRole("SUPER_ADMIN");
        assertTrue(result.contains("ORDER_UPDATE"));
        assertTrue(result.contains("MANAGE_ROLE_PERMISSIONS"));
    }

    @Test
    void hasPermission_staffFromRepository() {
        when(permissionCacheService.getCached("STAFF")).thenReturn(null);
        when(rolePermissionRepository.findByRoleCode("STAFF")).thenReturn(List.of(
                RolePermission.builder().roleCode("STAFF").permissionCode("ORDER_READ").enabled(true).build(),
                RolePermission.builder().roleCode("STAFF").permissionCode("ORDER_UPDATE").enabled(true).build(),
                RolePermission.builder().roleCode("STAFF").permissionCode("ORDER_CANCEL").enabled(false).build()
        ));

        assertTrue(rbacService.hasPermission("STAFF", "ORDER_UPDATE"));
        assertFalse(rbacService.hasPermission("STAFF", "ORDER_CANCEL"));
    }

    @Test
    void permissionsForRole_usesCacheWhenPresent() {
        when(permissionCacheService.getCached("STAFF")).thenReturn(List.of("ORDER_READ"));
        assertEquals(List.of("ORDER_READ"), rbacService.permissionsForRole("STAFF"));
        verify(rolePermissionRepository, never()).findByRoleCode(anyString());
    }
}
