package www.config;

import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class OpenAiConfig {

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.timeout-ms:30000}")
    private long timeoutMs;

    @Bean
    public WebClient openAiWebClient() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofMillis(timeoutMs))
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, (int) Math.min(timeoutMs, 10_000));

        return WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
