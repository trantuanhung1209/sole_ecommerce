package www.modules.search.port;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import www.modules.catalog.dto.ProductDtos.ProductSummary;
import www.modules.catalog.dto.ProductFilter;

public interface ProductSearchPort {
    Page<ProductSummary> search(ProductFilter filter, Pageable pageable);
}
