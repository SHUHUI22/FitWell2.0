// spoonacular API key 
const apiKey = "ec2038346da449b89a58e0be5dee7ec3";

const btn_analyze = document.getElementById("btn-analyze")
btn_analyze.addEventListener("click", getNutrition);

// Function to get nutrition info
async function getNutrition() {
  const input = document.getElementById('search-input').value.trim();
  const inputList = input.split(',').map(item => item.trim()).join('\n');
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = '';
  // Show loading message
  outputDiv.innerHTML = '<div class="loading">Loading...</div>';
  // Clear input field after the click
  document.getElementById('search-input').value = '';

  if (!input) {
    outputDiv.innerHTML = '<div class="error">Please enter ingredients.</div>';
    return;
  }

  try {
    const parseUrl = `https://api.spoonacular.com/recipes/parseIngredients?apiKey=${apiKey}&ingredientList=${encodeURIComponent(inputList)}&servings=1`;

    const parseResponse = await fetch(parseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const parsedData = await parseResponse.json();
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      outputDiv.innerHTML = '<div class="error">No ingredients found.</div>';
      return;
    }

    let allNutrients = [];

    for (const item of parsedData) {
      const id = item.id;
      if (!id) continue;

      const infoUrl = `https://api.spoonacular.com/food/ingredients/${id}/information?apiKey=${apiKey}&amount=${item.amount}&unit=${item.unit}`;
      const infoResponse = await fetch(infoUrl);
      const infoData = await infoResponse.json();

      // Log the entire nutrition data to the console
      console.log('Nutrition Info for', item.name, ':', infoData.nutrition);

      const nutrients = infoData.nutrition?.nutrients || [];
      allNutrients.push(...nutrients);
    }

    // Merge nutrient data
    const nutrientMap = {};
    allNutrients.forEach(n => {
      const name = n.name;
      if (!nutrientMap[name]) {
        nutrientMap[name] = { amount: n.amount, unit: n.unit, percent: n.percentOfDailyNeeds };
      } else {
        nutrientMap[name].amount += n.amount;
        nutrientMap[name].percent += n.percentOfDailyNeeds;
      }
    });

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

    const tableHTML = generateStructuredTable(nutrientMap, nutrientGroups);
    outputDiv.innerHTML = `
        <div class="subtitle">For: <strong>${input}</strong></div>
        ${tableHTML}
        <div class="note">* Nutritional values are sourced from the Spoonacular API and may vary based on ingredient quality.</div>
      `;

  } catch (err) {
    console.error(err);
    outputDiv.innerHTML = '<div class="error">Failed to fetch data. Please try again.</div>';
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