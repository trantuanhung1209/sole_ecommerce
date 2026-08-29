package www.model.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    
    private List<T> content; // Dữ liệu của trang hiện tại
    
    private Integer page; // Trang hiện tại (bắt đầu từ 0)
    
    private Integer size; // Số items mỗi trang
    
    private Long totalElements; // Tổng số items
    
    private Integer totalPages; // Tổng số trang
    
    private Boolean first; // Có phải trang đầu không
    
    private Boolean last; // Có phải trang cuối không
    
    private Boolean empty; // Có rỗng không
}
