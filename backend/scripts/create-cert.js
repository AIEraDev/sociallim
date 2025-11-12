const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Create certificates directory
const certDir = path.join(__dirname, "..", "certs");
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

// Generate self-signed certificate
try {
  execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${certDir}/key.pem -out ${certDir}/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: "inherit" });
  console.log("✅ SSL certificates created successfully!");
  console.log("📁 Certificates saved to:", certDir);
} catch (error) {
  console.error("❌ Error creating certificates:", error.message);
  console.log("💡 Make sure OpenSSL is installed on your system");
}
