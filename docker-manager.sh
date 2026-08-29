#!/bin/bash

# WWW Project Docker Manager for macOS/Linux

echo "==================================="
echo "     WWW Project Docker Manager"
echo "==================================="

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Set default values if not found in .env
BACKEND_PORT=${BACKEND_PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

show_menu() {
    echo
    echo "1. Start all services (with build)"
    echo "2. Start all services (without build)"
    echo "3. Stop all services"
    echo "4. Restart all services"
    echo "5. View logs"
    echo "6. Clean up (remove containers and volumes)"
    echo "7. Exit"
    echo
}

build_start() {
    echo "Starting all services with build..."
    docker-compose up --build -d
    echo "Services started! Check at:"
    echo "- Frontend: http://localhost:$FRONTEND_PORT"
    echo "- Backend: http://localhost:$BACKEND_PORT"
}

start_services() {
    echo "Starting all services..."
    docker-compose up -d
    echo "Services started!"
    echo "- Frontend: http://localhost:$FRONTEND_PORT"
    echo "- Backend: http://localhost:$BACKEND_PORT"
}

stop_services() {
    echo "Stopping all services..."
    docker-compose down
    echo "Services stopped!"
}

restart_services() {
    echo "Restarting all services..."
    docker-compose restart
    echo "Services restarted!"
}

show_logs() {
    echo "Showing logs... (Press Ctrl+C to exit)"
    docker-compose logs -f
}

cleanup() {
    echo "WARNING: This will remove all containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        docker system prune -f
        echo "Cleanup completed!"
    else
        echo "Cleanup cancelled."
    fi
}

# Main loop
while true; do
    show_menu
    read -p "Choose an option (1-7): " choice

    case $choice in
        1)
            build_start
            ;;
        2)
            start_services
            ;;
        3)
            stop_services
            ;;
        4)
            restart_services
            ;;
        5)
            show_logs
            ;;
        6)
            cleanup
            ;;
        7)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid option. Please choose 1-7."
            ;;
    esac

    echo
    read -p "Press Enter to continue..."
done
