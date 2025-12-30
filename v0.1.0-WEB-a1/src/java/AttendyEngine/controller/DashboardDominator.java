package AttendyEngine.controller;

import AttendyEngine.datahandy.User;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
public class DashboardDominator {

    @GetMapping
    public String dashboard(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "Please login first.";
        }
        return "Welcome, " + user.getFullName() + "! Role: " + user.getRole();
    }
}
