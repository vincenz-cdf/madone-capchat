CREATE TABLE theme (
    id INT AUTO_INCREMENT,
    label VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO theme (id, label) VALUES (1, "GENERAL");

ALTER TABLE image_sets
ADD COLUMN theme_id INT;

UPDATE image_sets
SET theme_id = 1;

ALTER TABLE image_sets
DROP COLUMN theme;

ALTER TABLE image_sets
ADD FOREIGN KEY (theme_id) REFERENCES theme(id);

