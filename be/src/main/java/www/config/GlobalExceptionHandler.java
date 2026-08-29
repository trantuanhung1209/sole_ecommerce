package www.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import www.exception.AuthException;
import www.exception.BadRequestException;
import www.exception.ForbiddenException;
import www.exception.JwtAuthenticationException;
import www.exception.NotFoundException;
import www.exception.TokenBlacklistedException;
import www.model.dto.response.ApiResponse;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthException(AuthException ex) {
        log.warn("Auth exception: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.badRequest(ex.getMessage()));
    }

    @ExceptionHandler(TokenBlacklistedException.class)
    public ResponseEntity<ApiResponse<Object>> handleTokenBlacklistedException(TokenBlacklistedException ex) {
        log.warn("Blacklisted token access attempt: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.unauthorized("Token has been revoked"));
    }

    @ExceptionHandler(JwtAuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleJwtAuthenticationException(JwtAuthenticationException ex) {
        log.warn("JWT authentication failed: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.unauthorized("Invalid or expired token"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(AuthenticationException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.unauthorized("Authentication required"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.forbidden("Access denied"));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNotFoundException(NotFoundException ex) {
        log.warn("Not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.notFound(ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequestException(BadRequestException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.badRequest(ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Object>> handleForbiddenException(ForbiddenException ex) {
        log.warn("Forbidden: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.forbidden(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.warn("Validation error: {}", errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Map<String, String>>builder()
                        .status(400)
                        .message("Validation failed")
                        .data(errors)
                        .build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("Illegal argument exception: {}", ex.getMessage());
        if (ex.getMessage().contains("No enum constant")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.badRequest("Invalid data format in database. Please contact administrator."));
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.badRequest("Invalid request: " + ex.getMessage()));
    }

    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleAsyncDisconnect(AsyncRequestNotUsableException ex) {
        if (isClientDisconnect(ex)) {
            log.debug("Client disconnected during async response: {}", ex.getMessage());
            return;
        }
        log.warn("Async request failed: {}", ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotWritableException.class)
    public void handleNotWritable(HttpMessageNotWritableException ex) {
        if (isClientDisconnect(ex) || isSseResponse(ex)) {
            log.debug("Skipped writing response after client disconnect: {}", ex.getMessage());
            return;
        }
        log.warn("Response not writable: {}", ex.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        if (isClientDisconnect(ex)) {
            log.debug("Client disconnected: {}", ex.getMessage());
            return null;
        }
        log.error("Runtime exception: ", ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.badRequest(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        if (isClientDisconnect(ex)) {
            log.debug("Client disconnected: {}", ex.getMessage());
            return null;
        }
        log.error("Unexpected error: ", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "An unexpected error occurred"));
    }

    private static boolean isClientDisconnect(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof ClientAbortException
                    || current instanceof AsyncRequestNotUsableException) {
                return true;
            }
            if (current instanceof java.io.IOException io && "Broken pipe".equals(io.getMessage())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private static boolean isSseResponse(HttpMessageNotWritableException ex) {
        String message = ex.getMessage();
        return message != null && message.contains("text/event-stream");
    }
}