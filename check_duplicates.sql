
SELECT 
    contract_number, 
    COUNT(*) 
FROM 
    contracts 
GROUP BY 
    contract_number 
HAVING 
    COUNT(*) > 1;
