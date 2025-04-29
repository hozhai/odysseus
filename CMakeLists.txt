cmake_minimum_required(VERSION 3.31)
# Project name, version and description
project(odysseus VERSION 0.1.0 DESCRIPTION "An Arcane Odyssey utility bot.")

# Create an executable
add_executable(${PROJECT_NAME}
        src/main.cpp
)

include(FetchContent)

# dpp
FetchContent_Declare(dpp
        GIT_REPOSITORY https://github.com/brainboxdotcc/DPP
        GIT_TAG v10.1.2
)
FetchContent_MakeAvailable(dpp)

# cpr
FetchContent_Declare(cpr
        GIT_REPOSITORY https://github.com/libcpr/cpr.git
        GIT_TAG 1.11.2
)

FetchContent_MakeAvailable(cpr)

# cpp-dotenv
FetchContent_Declare(dotenv
        GIT_REPOSITORY https://github.com/adeharo9/cpp-dotenv.git
        GIT_TAG v0.2.0
)

FetchContent_MakeAvailable(dotenv)

# Link the pre-installed DPP package.
target_link_libraries(
        ${PROJECT_NAME}
        PRIVATE cpr::cpr
        PRIVATE dpp
        PRIVATE ${CPP_DOTENV}
)

# Set C++ version
set_target_properties(${PROJECT_NAME} PROPERTIES
        CXX_STANDARD 20
        CXX_STANDARD_REQUIRED ON
)