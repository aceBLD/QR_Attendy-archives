package AttendyEngine.controller;

import AttendyEngine.datahandy.User;
import AttendyEngine.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthDominator {
    private final UserService userService;

    public AuthDominator(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public String signup(@RequestBody User user) {
        userService.registerUser(user);
        return "User registered successfully!";
    }

    @PostMapping("/signin")
    public String signin(@RequestBody User user, HttpSession session) {
        Optional<User> dbUser = userService.findByEmail(user.getEmail());

        if (dbUser.isPresent() && dbUser.get().getPassword().equals(user.getPassword())) {
            session.setAttribute("user", dbUser.get());
            return "Login successful!";
        }
        return "Invalid email or password";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "Logged out successfully!";
    }
}
