# Contributing to EduAssist AI

Thank you for contributing to EduAssist AI! This guide outlines how our team collaborates throughout the project, from cloning the repo to merging a pull request.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Step-by-Step Guide](#step-by-step-guide)
- [Branch Naming](#branch-naming)
- [Commit Message Convention](#commit-message-convention)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Pull Request Checklist](#pull-request-checklist)
- [Creating a Pull Request (VS Code)](#creating-a-pull-request-vs-code)
- [After Your Pull Request Is Merged](#after-your-pull-request-is-merged)
- [Team Communication](#team-communication)
- [Need Help?](#need-help)

---

## Development Workflow

1. Pull the latest changes from the `develop` branch.
2. Create a new feature branch.
3. Implement your assigned task.
4. Test your changes locally.
5. Commit your work using a clear commit message.
6. Push your branch to GitHub.
7. Open a pull request to the `develop` branch.
8. Wait for at least one team member to review and approve before merging.

> **Do not push directly to the `main` or `develop` branches.**

### Workflow Summary

```text
Clone repository
        │
        ▼
Checkout develop
        │
        ▼
Pull latest changes
        │
        ▼
Create feature branch
        │
        ▼
Develop feature
        │
        ▼
git add .
        │
        ▼
git commit
        │
        ▼
git push
        │
        ▼
Create pull request → develop
        │
        ▼
Code review
        │
        ▼
Merge
        │
        ▼
Pull latest changes
        │
        ▼
Delete feature branch
```

---

## Step-by-Step Guide

A detailed walkthrough for setting up your environment and shipping a change, from clone to cleanup.

### 1. Clone the repository

```bash
git clone https://github.com/EAkatse/tomcat-student-support-ai-api
```

### 2. Navigate into the project

```bash
cd eduassist-ai
```

### 3. Open the project in VS Code

```bash
code .
```

### 4. Switch to the `develop` branch

```bash
git checkout develop
```

If the branch doesn't exist locally:

```bash
git fetch origin
git checkout -b develop origin/develop
```

### 5. Pull the latest changes

Always pull before starting work.

```bash
git pull origin develop
```

### 6. Create your feature branch

Replace `<feature-name>` with your assigned task (see [Branch Naming](#branch-naming)).

```bash
git checkout -b feature/<feature-name>
```

Example:

```bash
git checkout -b feature/frontend-homepage
```

### 7. Work on your task

Make your changes, then check which files were modified:

```bash
git status
```

### 8. Stage your changes

Stage all files:

```bash
git add .
```

Or stage a specific file:

```bash
git add backend/src/handlers/ask.py
```

### 9. Commit your changes

Use a meaningful commit message (see [Commit Message Convention](#commit-message-convention)):

```bash
git commit -m "feat: add ask question endpoint"
```

More examples:

```bash
git commit -m "fix: resolve DynamoDB query issue"
git commit -m "docs: update README"
git commit -m "refactor: simplify AI service"
```

### 10. Push your branch

The first push:

```bash
git push -u origin feature/<feature-name>
```

Example:

```bash
git push -u origin feature/frontend-homepage
```

After that, simply use:

```bash
git push
```

Once pushed, open a pull request — see [Creating a Pull Request (VS Code)](#creating-a-pull-request-vs-code).

---

## Branch Naming

Use the following naming convention:

```text
feature/<feature-name>
bugfix/<bug-name>
hotfix/<issue-name>
```

Examples:

```text
feature/frontend-homepage
feature/ask-question-api
feature/cloudwatch-monitoring
bugfix/delete-endpoint
```

---

## Commit Message Convention

Use meaningful, prefixed commit messages:

```text
feat: add ask question endpoint
fix: resolve DynamoDB query issue
docs: update README
refactor: simplify AI service
test: add Lambda tests
ci: update deployment workflow
```

---

## Project Structure

Work only in the folder related to your assigned task.

```text
frontend/          React application
backend/           AWS Lambda APIs
infrastructure/    AWS resources
.github/           GitHub Actions
diagrams/          Architecture diagrams
docs/              Project documentation
```

---

## Coding Guidelines

- Write clean and readable code.
- Follow the existing project structure.
- Keep functions small and focused.
- Reuse existing utilities where possible.
- Do not commit secrets or API keys.
- Update documentation if your changes affect the project.

---

## Pull Request Checklist

Before creating a pull request, make sure:

- [ ] My code works as expected.
- [ ] I tested my changes.
- [ ] My branch is up to date with `develop`.
- [ ] I used a clear commit message.
- [ ] I updated documentation if necessary.

---

## Creating a Pull Request (VS Code)

We use the **GitHub Pull Requests and Issues** extension.

1. Open VS Code.
2. Click the **Source Control** icon.
3. Push your branch if you haven't already.
4. Click the **GitHub** icon on the left sidebar.
5. Click **Create Pull Request**.
6. Configure the pull request:

   | Field | Value |
   |-------|-------|
   | Base branch | `develop` |
   | Compare branch | `feature/<feature-name>` |

   Example:

   ```text
   Base: develop
   Compare: feature/frontend-homepage
   ```

7. Add a title, e.g. `feat: add homepage UI`.
8. Add a short description, e.g.:

   ```text
   ## Summary

   - Added homepage layout
   - Added hero section
   - Added navigation
   - Improved responsiveness
   ```

9. Click **Create Pull Request**.

### If changes are requested

Make the requested changes, then run:

```bash
git add .
git commit -m "fix: address PR review comments"
git push
```

The pull request updates automatically.

---

## After Your Pull Request Is Merged

1. Switch back to `develop`:

   ```bash
   git checkout develop
   ```

2. Pull the latest changes:

   ```bash
   git pull origin develop
   ```

3. Delete your local feature branch:

   ```bash
   git branch -d feature/<feature-name>
   ```

4. Delete the remote branch:

   ```bash
   git push origin --delete feature/<feature-name>
   ```

You're now ready to start your next task.

---

## Team Communication

- Ask questions early if you're unsure.
- Keep pull requests focused on one feature or fix.
- Review teammates' pull requests when requested.
- Be respectful and provide constructive feedback.
