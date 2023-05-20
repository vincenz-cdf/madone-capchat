DROP DATABASE IF EXISTS capchat;
CREATE DATABASE capchat;

use capchat;

CREATE TABLE user (
    id INT AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE image_sets (
    id INT AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    theme VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE image (
    id INT AUTO_INCREMENT,
    image_sets_id INT,
    singular BOOLEAN NOT NULL,
    path VARCHAR(255) NOT NULL,
    hint VARCHAR(255) NOT NULL default '',
    PRIMARY KEY (id),
    FOREIGN KEY (image_sets_id) REFERENCES image_sets(id)
);

INSERT INTO user (username, password) VALUES ('batch', '');

INSERT INTO image_sets (user_id, name, theme) VALUES (1, 'General', 'GENERAL');

INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_1.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_2.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_3.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_4.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_5.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_6.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_7.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_8.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_9.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_10.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_11.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_12.jpg');
INSERT INTO image (image_sets_id, singular, path) VALUES (1, FALSE, '/resources/neutres/chat_neutre_13.jpg');

INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_amoureux.jpg', 'Saurez vous reconnaître un chat amoureux ?');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_bien_coiffe.jpg', 'Mon chat est une fausse blonde');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_borgne.jpg', 'Ce chat là a fait une croix sur son oeil');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_chapeaute.jpg', 'C''est encore le chat qui porte le chapeau');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_cosmonaute.jpg', 'Saurez-vous reconnaître le chat de Thomas Pesquet ?');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_cyclope.jpg', 'Saurez-vous reconnaître le chat CYPLOPE ?');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_licorne.jpg', 'Ne confondons pas une salicorne et un chat-licorne !');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_malade.jpg', 'Ce chat là a oublié de se faire vacciner contre la grippe');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_moustachu.jpg', 'Quel type de chat se cache derrière ses moustaches ?');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_myope.jpg', 'Chaussez vos lunettes et montrez-moi le chat myope ?');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_pirate.jpg', 'Après la fiancée du pirate, voici le chat du corsaire');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_plongeur.jpg', 'Chat du grand bleu');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_princesse.jpg', 'C''est la reine d''Angleterre qui a perdu son chat');
INSERT INTO image (image_sets_id, singular, path, hint) VALUES (1, TRUE, '/resources/singuliers/chat_titi_parisien.jpg', 'Après les gilets jaunes, voici les foulards rouges');