const fs = require('fs');

const path = 'C:/Users/Admin/Desktop/Polaroify/app.js';
let content = fs.readFileSync(path, 'utf8');

const target = `  });
});`;

const replacement = `  });
});

document.querySelectorAll("[data-step-indicator]").forEach((indicator) => {
  indicator.addEventListener("click", () => {
    // Only allow clicking forward if we have selected a track (or clicking back freely)
    const targetStep = parseInt(indicator.getAttribute("data-step-indicator"), 10);
    if (targetStep > 1 && !state.selected) {
      setStatus("Select a track or album first to continue.");
      return;
    }
    goToStep(targetStep);
  });
});`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log("Success");
} else {
  console.log("Target not found");
}
