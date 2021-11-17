const assert = require('assert');
const Factory = require('../multiFruitFactory');

const { Pool } = require('pg');

// const connectionString = process.env.DATABASE_URL || 'postgres://jaden:mypass@localhost:5432/fruitbasket';
const connectionString = 'postgres://postgres@localhost/fruitbasket';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

const factory = Factory(pool);

describe('Multi Fruit Basket testing:', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM fruit_basket_item');
        await pool.query('DELETE FROM multi_fruit_basket');

        await pool.query('ALTER SEQUENCE fruit_basket_item_id_seq RESTART WITH 1')
        await pool.query('ALTER SEQUENCE multi_fruit_basket_id_seq RESTART WITH 1')
    })

    describe('Create new basket function:', () => {
        it('Should create new basket "Apple Sample" and item entry "Apple" with values quantity = 2 and item_price = 3', async () => {
            await factory.createFruitBasket('Apple Sample', 'Apple', 2, 3);

            const appleBasket = await (await pool.query("SELECT * FROM multi_fruit_basket")).rows[0];
            const appleItem = await (await pool.query('SELECT * FROM fruit_basket_item')).rows[0];

            assert.equal(appleBasket.name, 'Apple Sample');

            assert.equal(appleItem.fruit_name, 'Apple');
            assert.equal(appleItem.qty, 2);
            assert.equal(appleItem.unit_price, 3);
        })

        it('Should not allow you to create new basket "Apple Sample" since "Apple Sample" basket already exists', async () => {
            await factory.createFruitBasket('Apple Sample', 'Apple', 2, 3);

            assert.equal(await factory.createFruitBasket('Apple Sample', 'Apple', 2, 3), false);
        })
    })

    describe('Add and remove fruit functions:', () => {
        it('Should add extra fruit item "Red Apple" to fruit basket "Apples"', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
            await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

            const appleItem = await (await pool.query('SELECT * FROM fruit_basket_item')).rows;

            assert.equal(appleItem[1].fruit_name, 'Red Apple');
            assert.equal(appleItem[1].qty, 5);
            assert.equal(appleItem[1].unit_price, 3);
        })

        it('Should remove fruit item "Green Apple" from basket "Apples"', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
            await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

            await factory.removeFruitItem('Apples', 'Green Apple');

            const appleItem = await (await pool.query('SELECT * FROM fruit_basket_item')).rows;

            assert.equal(appleItem[0].fruit_name, 'Red Apple');
            assert.equal(appleItem[0].qty, 5);
            assert.equal(appleItem[0].unit_price, 3);
        })

        it('Should throw an error when given non-existent item "Blue Apple" in basket "Apples"', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
            await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

            assert.equal(await factory.removeFruitItem('Apples', 'Blue Apple'), false);
        })

        it('Should delete basket "Apples" once the last item "Green Apple" has been removed', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);

            await factory.removeFruitItem('Apples', 'Green Apple');
            const basket = await (await pool.query("SELECT * FROM multi_fruit_basket WHERE name='Apples'")).rows;
            assert.deepEqual(basket, []);
        })
    })

    describe('Get specified basket function:', () => {
        it('Should get details of basket "Apples" and fruits in said basket when given the id for basket "Apples"', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
            await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

            const basket = await factory.getBasket(1);

            assert.equal(basket.id, 1);
            assert.equal(basket.name, 'Apples');

            assert.equal(basket.fruits[0].fruit_name, 'Green Apple');
            assert.equal(basket.fruits[0].qty, 2);
            assert.equal(basket.fruits[0].unit_price, 3);

            assert.equal(basket.fruits[1].fruit_name, 'Red Apple');
            assert.equal(basket.fruits[1].qty, 5);
            assert.equal(basket.fruits[1].unit_price, 3);
        })

        it('Should throw an error if given basket id, 2, does not belong to a basket in database', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);

            assert.equal(await factory.getBasket(2), false);
        })
    })

    describe('Calculate total price of basket function:', () => {
        it('Should calculate the total price of basket "Apples" from the given basket name "Apples" and id 1', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
            await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

            await factory.createFruitBasket('Pears', 'Big Pears', 5, 4);
            await factory.addFruitItem('Pears', 'Small Pears', 4, 3);
            await factory.addFruitItem('Pears', 'Medium Pears', 2, 5);

            assert.equal(await factory.calcBasketTotal('Apples', 1), 21);
        })

        it('Should calculate the total price of basket "Pears" from the given basket name "Pears" and id 2', async () => {
            await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
            await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

            await factory.createFruitBasket('Pears', 'Big Pears', 5, 4);
            await factory.addFruitItem('Pears', 'Small Pears', 4, 3);
            await factory.addFruitItem('Pears', 'Medium Pears', 2, 5);

            assert.equal(await factory.calcBasketTotal('Pears', 2), 42);
        })
    })
})