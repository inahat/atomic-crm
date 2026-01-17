
ALTER TABLE contacts 
ADD COLUMN address_line_1 text,
ADD COLUMN city text,
ADD COLUMN postcode text,
ADD COLUMN country text DEFAULT 'UK';
