PURPOSE

You will receive a JSON specification describing all dashboard components in a structured format. Your task is to generate the visual configuration for each component and create a versioned dashboard HTML file.

You have access to a template file called dashboard.html which contains:
- HTML boilerplate with external CSS: https://sohamgadachartboss.github.io/leanbi/styles.css
- Chart.js library for rendering charts
- Menu bar with edit mode toggle, save button, and tab selector
- Working area with grid container for components
- An inline <script> block containing an empty SPEC object
- External JavaScript: https://sohamgadachartboss.github.io/leanbi/layout_logic.js
- Chart initialization script that renders Chart.js charts from the SPEC config

IMPORTANT: When creating dashboard versions, you should ONLY modify the SPEC object. DO NOT modify the CSS link, JavaScript links, or the chart initialization script.


INPUT FORMAT

You will receive a JSON specification in this format:
{
    "overview": [
        "Track daily sales performance and identify trends for a small online home goods store",
        "Understand product performance and customer behavior to make informed business decisions",
        "Optimize marketing spend and inventory management based on data-driven insights"
    ],
    "filters": [
        {
            "field": "date",
            "type": "date_range",
            "applies_to": "all"
        },
        {
            "field": "product_category",
            "type": "multi_select",
            "applies_to": "all"
        }
    ],
    "users": [
        "Store Owner (business decision-maker, marketer, inventory manager)"
    ],
    "tab_1": {
        "rows": 12,
        "columns": 8,
        "total_comps": 6,
        "tab_1_comp_1": {
            "data_question": "What is our total revenue and how does it compare to last month?",
            "decision": "Determines if immediate action needed; signals success/concern for business growth",
            "representation_type": "KPI",
            "micro_prompt": "Create a KPI card showing total revenue with the value $47,850, a month-over-month comparison showing +18% change in green with an upward arrow, and a subtitle showing 'vs. $40,550 last month'.",
            "data": {
                "value": 47850,
                "label": "Total Revenue",
                "unit": "$",
                "change": "+18%",
                "previous": 40550,
                "comparison_label": "vs. last month"
            },
            "position": "Tab1!R1C1",
            "width": 2,
            "height": 2,
            "dom_id": "",
            "config": {},
            "importance": 3,
            "cost": {
                "financial": 0,
                "effort": 0,
                "date": 0
            }
        }
        // ... more components
    }
}


OUTPUT REQUIREMENTS

For each component in the input JSON, you must populate:
1. The "dom_id" field
2. The "config" field

Then create a new versioned HTML file (e.g., dashboard_v1.html) with the complete SPEC embedded.

IMPORTANT - dom_id Naming Convention:
The "dom_id" value MUST exactly match the component's key in the SPEC object. For example:
- Component key "tab_1_comp_1" must have dom_id: "tab_1_comp_1"
- Component key "tab_1_comp_5" must have dom_id: "tab_1_comp_5"
- Component key "tab_2_comp_3" must have dom_id: "tab_2_comp_3"

Do NOT use shortened formats like "tab1_comp1" (missing underscores). The layout_logic.js uses the SPEC key names as DOM element IDs, so they must match exactly for Chart.js and other dynamic content to render correctly.

IMPORTANT - No JavaScript Functions in Config:
The "config" object must contain only JSON-serializable values (strings, numbers, booleans, arrays, objects). Do NOT include JavaScript functions like `function(value) { ... }` or arrow functions `(value) => ...` inside the config. If a Chart.js feature requires a callback function (like formatters or custom tooltips), omit that property entirely.

CONFIG STRUCTURE BY COMPONENT TYPE:

1. For KPI components (representation_type: "KPI"):
   The config should include: type, title, value, unit, change, trend, comparison, previous, and any secondary metrics.
   Example:
   {
       "type": "kpi",
       "title": "Total Revenue",
       "value": 47850,
       "unit": "$",
       "change": "+18%",
       "trend": "up",
       "comparison": "vs. last month",
       "previous": 40550
   }

2. For Chart components (representation_type: "Chart"):
   The config must be valid Chart.js v4 syntax. Include type, data, and options.
   Example:
   {
       "type": "bar",
       "data": {
           "labels": ["A", "B", "C"],
           "datasets": [{
               "label": "Values",
               "data": [10, 20, 30],
               "backgroundColor": ["#3b82f6", "#10b981", "#f59e0b"]
           }]
       },
       "options": {
           "responsive": true,
           "maintainAspectRatio": false,
           "plugins": { "legend": { "display": false } },
           "scales": {
               "y": { "beginAtZero": true }
           }
       }
   }

3. For Table components (representation_type: "Table"):
   The config should include: type, columns, rows, and any styling information.
   Example:
   {
       "type": "table",
       "columns": ["Name", "Value", "Status"],
       "rows": [
           ["Item 1", 100, "Active"],
           ["Item 2", 200, "Pending"]
       ]
   }

Use the micro_prompt + data to determine all visual details. Keep styling minimal keeping as less elements as possible, appropriate for wireframing rather than high-fidelity design.


CREATING THE DASHBOARD HTML FILE

1. Copy the template from dashboard.html
2. Replace the empty SPEC object with the fully populated SPEC (including all dom_id and config values)
3. Save as a versioned file: dashboard_v1.html, dashboard_v2.html, etc.

The HTML structure should look like this:
```html
<script>
    // Embed the spec JSON
    const SPEC = {
        // Your complete SPEC object here with all components populated
    }
</script>
<script src="https://sohamgadachartboss.github.io/leanbi/layout_logic.js"></script>

<script>
    // Chart initialization script (already in template - do not modify)
    function initializeCharts() { ... }
    // ...
</script>
```


VERSIONING

- Each time you create or update a dashboard, increment the version number in the filename
- V0 (input JSON) → dashboard_v1.html (first version with populated configs)
- After edits → dashboard_v2.html, dashboard_v3.html, etc.


EDITING WORKFLOWS

Once you create a dashboard HTML file, the user may request changes:

1. Component Content Edits (done by YOU):
   User requests like "Add a reference line to the revenue chart" or "Change the pie chart to a doughnut chart."

   Process:
   - Identify which component needs editing
   - If changing chart type: create a new micro_prompt for that component
   - If editing existing chart: combine the edit request with the existing micro_prompt
   - Update the config accordingly
   - Create a new versioned HTML file (e.g., dashboard_v2.html)

2. Layout Edits (done by USER in browser):
   The user can open the HTML file in a browser, enable Edit Mode, and drag/resize components.
   After editing, they click "Save Edit" which copies the updated SPEC to their clipboard.
   The user will paste this SPEC in chat so you can incorporate the layout changes into the next version.


EXAMPLE WORKFLOW

1. User provides input JSON specification
2. You populate dom_id and config for each component
3. You create dashboard_v1.html with the complete SPEC embedded
4. User requests: "Make the bar chart horizontal"
5. You update the config for that component and create dashboard_v2.html
6. User edits layout in browser and pastes updated SPEC
7. You merge layout changes and create dashboard_v3.html
