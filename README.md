# 🛍️ Tooswasher.ir

Welcome to **Tooswasher.ir**! This project is a fully dockerized online shop application featuring a **FastAPI** backend and a **React** frontend, designed to provide a seamless shopping experience. 🛒

## ✨ Features

- 🚀 **FastAPI Backend**: Robust API for managing products, orders, and user authentication.
- 🎨 **React Frontend**: Responsive and user-friendly interface for customers.
- 🐳 **Dockerized Setup**: Simplified deployment with Docker containers for both backend and frontend components.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 📦 Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/hamidrezasun/tooswasher.ir.git
   cd tooswasher.ir
   ```

2. **Set Up Environment Variables**:

   Create a `.env` file in the project root and configure the necessary environment variables. Refer to `.env.example` for guidance.

3. **Build and Start the Containers**:

   ```bash
   docker-compose up --build
   ```

   This command builds the Docker images and starts the containers for both the backend and frontend.

## 🚀 Usage

Once the containers are running, access the application at:

- **Frontend**: [http://localhost:801/](http://localhost:801/)
- **Backend**: [http://localhost:801/api](http://localhost:801/api)
- **API Documentation**: [http://localhost:801/api/docs](http://localhost:801/api/docs)

> **Note**: Ensure that port 801 is not being used by another application to avoid conflicts.

## 📂 Project Structure

- **backend/**: Contains the FastAPI application.
- **frontend/**: Contains the React application.
- **docker-compose.yml**: Defines the services for Docker Compose.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes. Let's build something amazing together! 🚀

## 📄 License

This project is licensed under the **GPL-3.0 License**. See the [LICENSE](LICENSE) file for details.

---

Happy coding! 💻 