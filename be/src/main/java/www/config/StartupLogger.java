package www.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Properties;

@Component
@Slf4j
public class StartupLogger {

    @Value("${server.port}")
    private int serverPort;

    @Value("${server.servlet.context-path:/}")
    private String contextPath;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.database:0}")
    private int redisDatabase;

    private final RedisConnectionFactory redisConnectionFactory;

    public StartupLogger(RedisConnectionFactory redisConnectionFactory) {
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logStartupSummary(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        String profiles = Arrays.toString(env.getActiveProfiles());
        if (profiles.equals("[]")) {
            profiles = "[default]";
        }

        String basePath = contextPath.endsWith("/")
                ? contextPath.substring(0, contextPath.length() - 1)
                : contextPath;

        log.info("============================================================");
        log.info("SOLE Backend ready");
        log.info("  Profile : {}", profiles);
        log.info("  API     : http://localhost:{}{}", serverPort, basePath);
        log.info("  Swagger : http://localhost:{}{}/swagger-ui.html", serverPort, basePath);
        log.info("  Health  : http://localhost:{}{}/actuator/health", serverPort, basePath);
        logRedisSummary();
        log.info("  Demo login: customer@sole.test / Sole@123 (see README for all roles)");
        log.info("============================================================");
    }

    private void logRedisSummary() {
        try (var connection = redisConnectionFactory.getConnection()) {
            Properties server = connection.serverCommands().info("server");
            String version = server != null ? server.getProperty("redis_version", "?") : "?";
            Long dbSize = connection.serverCommands().dbSize();
            long refreshKeys = countKeys(connection, "refresh:*");
            long accessKeys = countKeys(connection, "access:*");
            long otpKeys = countKeys(connection, "otp:*");

            log.info("  Redis   : {}:{} db{} (v{})", redisHost, redisPort, redisDatabase, version);
            log.info("  Redis keys: total={} | refresh={} | access={} | otp={}",
                    dbSize != null ? dbSize : 0, refreshKeys, accessKeys, otpKeys);
            if (dbSize != null && dbSize == 0) {
                log.warn("  Redis db{} is empty — login once to create refresh:/access: keys", redisDatabase);
            }
        } catch (Exception e) {
            log.error("  Redis   : FAILED to connect {}:{} db{} — auth sessions will not persist",
                    redisHost, redisPort, redisDatabase, e);
        }
    }

    private long countKeys(org.springframework.data.redis.connection.RedisConnection connection, String pattern) {
        var keys = connection.keyCommands().keys(pattern.getBytes());
        return keys != null ? keys.size() : 0;
    }
}
