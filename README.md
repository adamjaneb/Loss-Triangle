This document outlines the development process of the Loss Data Analysis application, built using Angular. The application allows users to upload Excel files containing loss data and performs various analyses, including generating a loss triangle, calculating link ratios, and calculating IBNR.

# Features
Excel File Upload: Users can upload .xlsx or .xls files.  

Data Processing: The application processes the uploaded data to generate loss triangles, calculate link ratios, and calculate IBNR.  

Dynamic Tables: Results are displayed in responsive tables.

# Project process
1. I started with checking the doc type to see what type of data we are working with.
2. learn what is loss triangle, link ratios, IBNR, chain ladder method.
3. start creating the interface.
4. create the generate loss triangle function.
5. create the link ratio functions.
6. create the IBNR function.

# Project structure
1. app.component.ts
The main TypeScript file contains the logic for file uploading, data processing, and displaying results.
2. app.component.html
Includes buttons for uploading files, displaying the results in tables.

![Screenshot (22)](https://github.com/user-attachments/assets/3c584f68-68a2-46ae-bc73-e7c786dbb5c4)

Generate Loss Triangle

![Screenshot (24)](https://github.com/user-attachments/assets/f6c2e3ca-f11c-4f60-a635-f2e679764886)


Calculate Link ratios

![Screenshot (25)](https://github.com/user-attachments/assets/cd856411-ebf4-440b-8900-94a7a3fc0ada)

IBNR

![Screenshot (27)](https://github.com/user-attachments/assets/41a9cf99-1299-4f3e-9d9f-d5e953a1e618)


