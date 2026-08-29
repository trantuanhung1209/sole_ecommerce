# Spring Boot Dockerfile with hot reload support
FROM gradle:8.5-jdk17

WORKDIR /app

# Install tools for development
USER root
RUN apt-get update && apt-get install -y curl procps && rm -rf /var/lib/apt/lists/*

# Copy gradle files first for better caching
COPY build.gradle settings.gradle ./
COPY gradle gradle
COPY gradlew ./

# Make gradlew executable
RUN chmod +x ./gradlew

# Download dependencies
RUN ./gradlew dependencies --no-daemon

# Copy source code
#COPY src src

EXPOSE 8081

# Run bootRun with continuous build for hot reload
CMD ["./gradlew", "bootRun", "--continuous", "--no-daemon", "-Dspring.profiles.active=docker"]
