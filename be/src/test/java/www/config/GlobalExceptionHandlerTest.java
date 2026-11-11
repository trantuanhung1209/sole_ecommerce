package www.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import www.model.dto.response.ApiResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNoResourceFoundExceptionReturns404ApiResponse() {
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/api/cart/");

        ResponseEntity<ApiResponse<Object>> response = handler.handleNoResourceFoundException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getMessage()).isEqualTo("Endpoint not found");
    }

    @Test
    void mockMvcMapsNoResourceFoundExceptionTo404InsteadOf500() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new DummyController())
                .setControllerAdvice(handler)
                .build();

        mockMvc.perform(get("/api/cart/"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Endpoint not found"));
    }

    @RestController
    private static class DummyController {
        @GetMapping("/api/cart/")
        void missingTrailingSlash() throws NoResourceFoundException {
            throw new NoResourceFoundException(HttpMethod.GET, "/api/cart/");
        }
    }
}
