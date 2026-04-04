export const ContactModel = {
  tableName: 'contact',

  createTableSQL: `
    CREATE TABLE IF NOT EXISTS contact (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      contact_user_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_contact (user_id, contact_user_id),
      INDEX idx_user_id (user_id),
      INDEX idx_contact_user_id (contact_user_id),
      INDEX idx_status (status),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_user_id) REFERENCES user(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};
