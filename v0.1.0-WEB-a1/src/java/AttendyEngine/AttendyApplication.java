package AttendyEngine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;

/**
 * Main Spring Boot application entry.
 *
 * - Keeps base package scanning within "AttendyEngine" so your subpackages
 *   (datahandy, repohandy, controller, config, service, etc.) are discovered.
 * - @ServletComponentScan allows @WebFilter / @WebServlet / @WebListener
 *   annotations (if you use them in AttendyEngine.config).
 */
@SpringBootApplication(scanBasePackages = "AttendyEngine")
@ServletComponentScan(basePackages = "AttendyEngine.config")
public class AttendyApplication {
    public static void main(String[] args) {
        SpringApplication.run(AttendyApplication.class, args);
    }
}
