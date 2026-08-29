How to setup the **Three.js on Windows**, follow these steps.

## 1. Install Node.js

Three.js projects usually use **Node.js + npm**.

Download and install Node.js:

[Node.js Official Website](https://nodejs.org/?utm_source=chatgpt.com)

Choose **LTS version**.

After installing, open **Command Prompt** or **PowerShell** and check:

```bash
node -v
```

Example:

```
v24.0.0
```

Check npm:

```bash
npm -v
```

Example:

```
11.0.0
```

---

## 2. Create a Three.js project

Open Command Prompt:

Go to where you want the project:

```bash
cd Desktop
```

Create a folder:

```bash
mkdir three-test
```

Enter it:

```bash
cd three-test
```

---

## 3. Create npm project

Run:

```bash
npm init -y
```

You will get:

```
three-test
│
└── package.json
```

---

## 4. Install Three.js

Run:

```bash
npm install three
```

Now you will see:

```
three-test
│
├── node_modules
├── package.json
└── package-lock.json
```

---

## 5. Install Vite

Vite runs your website locally:

```bash
npm install vite --save-dev
```

---

## 6. Open project in VS Code

Install VS Code if you don't have it:

[Visual Studio Code Official Website](https://code.visualstudio.com/?utm_source=chatgpt.com)

Then:

```bash
code .
```

---

## 7. Create files

Your folder:

```
three-test
│
├── index.html
├── main.js
├── package.json
```

## happy  coding
