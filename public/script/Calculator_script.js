// spoonacular API key 
const apiKey = "ec2038346da449b89a58e0be5dee7ec3";

const btn_analyze = document.getElementById("btn-analyze")

// Define structured nutrient groups to show
const nutrientGroups = [
  {
    label: "Calories",
    items: ["Calories"]
  },
  {
    label: "Protein",
    items: ["Protein"]
  },
  {
    label: "Fat",
    items: ["Fat", "Saturated Fat", "Trans Fat", "Monounsaturated Fat", "Polyunsaturated Fat"]
  },
  {
    label: "Carbohydrates",
    items: ["Carbohydrates"]
  },
  {
    label: "Cholesterol",
    items: ["Cholesterol"]
  },
  {
    label: "Vitamins & Minerals",
    items: ["Vitamin A", "Vitamin B5", "Vitamin B12", "Iron", "Calcium", "Potassium"]
  }
];

btn_analyze.addEventListener("click", getNutrition);

// Function to get nutrition info
async function getNutrition() {
  const input = document.getElementById('search-input').value.trim();
  const inputList = input.split(',').map(item => item.trim()).join('\n');
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = '<div class="loading">Loading...</div>';

  if (!input) {
    outputDiv.innerHTML = `
      <div class="subtitle">For: <strong>${input}</strong></div>
      <div class="error">Please enter ingredients.</div>
    `;
    return;
  }

  try {
    const response = await fetch('/FitWell/api/nutrition-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ingredientList: inputList })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      outputDiv.innerHTML = `
        <div class="subtitle">For: <strong>${input}</strong></div>
        <div class="error">Invalid server response.</div>
      `;
      console.error("❌ Failed to parse JSON:", e);
      return;
    }

    console.log("🔍 API response:", data);

    let resultHTML = `<div class="subtitle">For: <strong>${input}</strong></div>`;

    if (!response.ok) {
      resultHTML += `<div class="error">${data.error || "Something went wrong."}</div>`;
      outputDiv.innerHTML = resultHTML;
      document.getElementById('search-input').value = '';
      return;
    }

    if (!data.nutrientMap) {
      resultHTML += `<div class="error">No nutrition data found.</div>`;
      outputDiv.innerHTML = resultHTML;
      return;
    }

    const tableHTML = generateStructuredTable(data.nutrientMap, nutrientGroups);
    resultHTML += `
      ${tableHTML}
      <div class="note">* Nutritional values are sourced from the Spoonacular API and may vary based on ingredient quality.</div>
    `;
    outputDiv.innerHTML = resultHTML;

  } catch (err) {
    console.error(err);
    outputDiv.innerHTML = `
      <div class="subtitle">For: <strong>${input}</strong></div>
      <div class="error">Failed to fetch data. Please try again.</div>
    `;
  }
}

function generateStructuredTable(nutrientMap, groups) {
  const groupIcons = {
    "Calories": '<i class="fas fa-fire"></i>',
    "Protein": '<i class="fas fa-drumstick-bite"></i>',
    "Fat": '<i class="fas fa-bacon"></i>',
    "Carbohydrates": '<i class="fas fa-bread-slice"></i>',
    "Cholesterol": '<i class="fas fa-heart"></i>',
    "Vitamins & Minerals": '<i class="fas fa-capsules"></i>'
  };

  let tableHTML = `
      <table>
        <tr>
          <th>Nutrient</th>
          <th>Amount</th>
          <th>% Daily Value*</th>
        </tr>
    `;

  for (const group of groups) {
    const icon = groupIcons[group.label] || '';
    tableHTML += `
        <tr><td colspan="3"><strong>${icon} ${group.label}</strong></td></tr>
      `;

    for (const item of group.items) {
      const nutrient = nutrientMap[item];
      if (nutrient) {
        const amount = `${nutrient.amount.toFixed(2)} ${nutrient.unit}`;
        const daily = isFinite(nutrient.percent) ? `${nutrient.percent.toFixed(2)}%` : '—';
        tableHTML += `
            <tr>
              <td style="padding-left: 20px;">${item}</td>
              <td>${amount}</td>
              <td>${daily}</td>
            </tr>
          `;
      }
    }
  }

  tableHTML += `</table>`;
  return tableHTML;
}