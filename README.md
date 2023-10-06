# Custom Captcha Generator API

## Overview
The Custom Captcha Generator API is a Node.js backend application designed to create, store, and manage custom captchas. Users can upload their own set of images, and the application will generate a captcha. Additionally, users can retrieve a link to embed the captcha into their own website.

## Features
- **Image Upload**: Users can upload a set of images to be used in captcha generation.
- **Captcha Generation**: The application generates captchas using the provided images.
- **Link Generation**: Provides a link to the generated captcha that can be embedded in websites.
- **Captcha Validation**: Validates user responses to captchas.
- **Captcha Management**: Users can manage their captchas (e.g., update image sets, deactivate captchas).

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/download/)
- [npm](https://www.npmjs.com/get-npm)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/custom-captcha-generator-api.git
   ```
2. Navigate into the project directory:
   ```sh
   cd custom-captcha-generator-api
   ```
3. Install NPM packages:
   ```sh
   npm install
   ```
4. Setup your environment variables in a `.env` file (refer to `.env.example` for required variables).
5. Start the server:
   ```sh
   npm start
   ```

## Usage
- **Add Images**: Upload a set of images via the `/upload` endpoint.
- **Generate Captcha**: Generate a captcha and retrieve a link via the `/generate` endpoint.
- **Embed Captcha**: Use the provided link to embed the captcha in your website.
- **Validate Captcha**: Validate user input via the `/validate` endpoint.

## API Documentation
You can find detailed API documentation [here](link-to-api-doc).

## Used Packages
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [body-parser](https://www.npmjs.com/package/body-parser)
- [cookie-parser](https://www.npmjs.com/package/cookie-parser)
- [cors](https://www.npmjs.com/package/cors)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [ejs](https://www.npmjs.com/package/ejs)
- [express](https://www.npmjs.com/package/express)
- [formidable](https://www.npmjs.com/package/formidable)
- [fs](https://www.npmjs.com/package/fs)
- [jquery](https://www.npmjs.com/package/jquery)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [multer](https://www.npmjs.com/package/multer)
- [mysql](https://www.npmjs.com/package/mysql)
- [path](https://www.npmjs.com/package/path)
- [unzipper](https://www.npmjs.com/package/unzipper)

## Contributing
We welcome contributions from the community. Please read the [contributing guidelines](CONTRIBUTING.md) for more information.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements
- [Express.js](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
