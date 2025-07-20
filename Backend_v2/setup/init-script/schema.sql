CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'none',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    github_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS LLMs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    model_id TEXT NOT NULL,
    model_token TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_name TEXT NOT NULL,
    github_url TEXT NOT NULL,
    owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    general_answer TEXT NOT NULL,
    -- assignments JSONB,
    -- prs JSONB,
    auto_grade BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    assignment_name TEXT NOT NULL,
    description TEXT,
    assignment_url TEXT NOT NULL,
    -- due_date TIMESTAMP NOT NULL,
    -- max_score INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prs (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    assignment_id INTEGER,
    pr_name TEXT NOT NULL,
    pr_description TEXT,
    status TEXT NOT NULL,
    pr_number INTEGER NOT NULL,
    result TEXT,
    status_grade TEXT NOT NULL DEFAULT 'Not Graded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    pr_id INTEGER NOT NULL,
    chat_history JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATE TABLE IF NOT EXISTS courses (


