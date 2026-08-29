package www.modules.search.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import www.model.dto.response.ApiResponse;
import www.modules.search.service.SearchIndexService;

@RestController
@RequestMapping("/admin/search")
@RequiredArgsConstructor
public class SearchAdminController {

    private final SearchIndexService searchIndexService;

    @PostMapping("/reindex")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> reindex() throws Exception {
        int count = searchIndexService.reindexAll();
        return ResponseEntity.ok(ApiResponse.success("Reindexed " + count + " products", count));
    }
}
