package AttendyEngine.service;

import AttendyEngine.datahandy.User;
import AttendyEngine.repohandy.UserOxygen;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserOxygen userOxygen;

    public UserService(UserOxygen userOxygen) {
        this.userOxygen = userOxygen;
    }

    public User registerUser(User user) {
        return userOxygen.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userOxygen.findByEmail(email);
    }
}
