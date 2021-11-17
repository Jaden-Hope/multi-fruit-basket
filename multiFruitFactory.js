module.exports = function multiFruitFactory(pool) {
    async function createFruitBasket(basketName, fruit, qty, unit_price) {
        const check = await pool.query('SELECT * FROM multi_fruit_basket WHERE name=$1', [basketName]);
        if (!check.rows[0]) {
            await pool.query('INSERT INTO multi_fruit_basket(name) VALUES ($1)', [basketName]);

            const id = await (await pool.query('SELECT id FROM multi_fruit_basket WHERE name = $1', [basketName])).rows[0].id;
            await pool.query('INSERT INTO fruit_basket_item(fruit_name, qty, unit_price, multi_fruit_basket_id) VALUES ($1, $2, $3, $4)', [fruit, qty, unit_price, id]);
        } else {
            return false;
        }
    }

    async function addFruitItem(basketName, fruit, qty, unit_price) {
        const basketID = await (await pool.query('SELECT id FROM multi_fruit_basket WHERE name=$1', [basketName])).rows[0].id;

        await pool.query('INSERT INTO fruit_basket_item(fruit_name, qty, unit_price, multi_fruit_basket_id) VALUES($1, $2, $3, $4)', [fruit, qty, unit_price, basketID]);
    }

    async function removeFruitItem(basketName, fruit) {
        const item = await (await pool.query('SELECT * FROM fruit_basket_item WHERE fruit_name=$1', [fruit])).rows[0];
        if (!item) {
            return false
        } else {
            await pool.query('DELETE FROM fruit_basket_item WHERE fruit_name=$1', [fruit]);
        }

        const basketID = await (await pool.query('SELECT id FROM multi_fruit_basket WHERE name=$1', [basketName])).rows[0].id;
        const check = await (await pool.query('SELECT * FROM fruit_basket_item WHERE multi_fruit_basket_id=$1', [basketID])).rows[0];

        if (!check) {
            await pool.query('DELETE FROM multi_fruit_basket WHERE id=$1', [basketID]);
        }
    }

    async function getBasket(basketID) {
        const basketInfo = await (await pool.query('SELECT * FROM multi_fruit_basket WHERE id=$1', [basketID])).rows[0];

        if (basketInfo) {
            const basketFruits = await (await pool.query('SELECT fruit_name, qty, unit_price FROM fruit_basket_item WHERE multi_fruit_basket_id=$1', [basketID])).rows;
            return { id: basketInfo.id, name: basketInfo.name, fruits: basketFruits };
        } else {
            return false;
        }
    }

    async function calcBasketTotal(basketName, basketID) {
        const total = await pool.query('SELECT SUM(qty * unit_price) FROM fruit_basket_item JOIN multi_fruit_basket ON multi_fruit_basket.id = multi_fruit_basket_id WHERE multi_fruit_basket.id=$1 AND name=$2', [basketID, basketName]);
        return total.rows[0].sum;
    }

    return {
        createFruitBasket,
        addFruitItem,
        removeFruitItem,
        getBasket,
        calcBasketTotal,
    }
}