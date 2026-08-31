package www.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import javax.imageio.ImageIO;

@Configuration
public class ImageIoConfig {

    @PostConstruct
    void registerImageIoPlugins() {
        ImageIO.scanForPlugins();
    }
}
