package www.modules.reports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import www.model.dto.response.ApiResponse;
import www.modules.reports.dto.ReportDtos.DashboardReport;
import www.modules.reports.service.ReportService;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SHOP_MANAGER','ADMIN','SUPER_ADMIN')")
public class ReportController {
    private final ReportService reportService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardReport>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(reportService.dashboard()));
    }
}
