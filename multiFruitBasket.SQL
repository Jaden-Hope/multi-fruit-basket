CREATE TABLE multi_fruit_basket (
    id serial PRIMARY KEY, 
    name text not null);
CREATE TABLE fruit_basket_item (
    id serial PRIMARY KEY, 
    fruit_name text not null, 
    qty int not null, 
    unit_price int not null, 
    multi_fruit_basket_id int, 
    FOREIGN KEY (multi_fruit_basket_id) 
    REFERENCES multi_fruit_basket(id)
    );