document.addEventListener('DOMContentLoaded', () => {
    // --- Variables Globales ---
    const productsContainer = document.querySelector('.product-cards-container');
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    const cartCountSpan = document.getElementById('cart-count');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalSpan = document.getElementById('cart-total');

    let cart = JSON.parse(localStorage.getItem('cart')) || []; // Cargar carrito desde localStorage

    // --- Funciones de Carrito de Compras ---

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartDisplay() {
        cartCountSpan.textContent = cart.reduce((total, item) => total + item.quantity, 0);
        cartItemsList.innerHTML = ''; // Limpiar la lista antes de actualizar
        let total = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<li>El carrito está vacío.</li>';
        } else {
            cart.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="cart-item-info">
                        ${item.name} - $${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div class="cart-item-actions">
                        <button class="decrease-quantity" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-quantity" data-id="${item.id}">+</button>
                        <button class="remove-item" data-id="${item.id}">Eliminar</button>
                    </div>
                `;
                cartItemsList.appendChild(li);
                total += item.price * item.quantity;
            });
        }
        cartTotalSpan.textContent = total.toFixed(2);
        saveCart();
    }

    function addItemToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartDisplay();
        alert(`${product.name} se añadió al carrito.`);
    }

    function removeItemFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartDisplay();
    }

    function updateItemQuantity(productId, change) {
        const item = cart.find(i => i.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeItemFromCart(productId);
            } else {
                updateCartDisplay();
            }
        }
    }

    // --- Event Listeners para el Carrito ---
    cartDropdown.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item')) {
            const id = parseInt(event.target.dataset.id);
            removeItemFromCart(id);
        } else if (event.target.classList.contains('increase-quantity')) {
            const id = parseInt(event.target.dataset.id);
            updateItemQuantity(id, 1);
        } else if (event.target.classList.contains('decrease-quantity')) {
            const id = parseInt(event.target.dataset.id);
            updateItemQuantity(id, -1);
        }
    });

    // Toggle para mostrar/ocultar el dropdown del carrito
    document.querySelector('.cart-summary').addEventListener('click', (event) => {
        // Evita que el clic en los botones dentro del dropdown cierre el dropdown
        if (!event.target.closest('#cart-dropdown') || event.target.id === 'checkout-button') {
            cartDropdown.classList.toggle('hidden');
        }
    });

    // Cerrar el dropdown del carrito si se hace clic fuera
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.cart-summary') && !cartDropdown.classList.contains('hidden')) {
            cartDropdown.classList.add('hidden');
        }
    });


    // --- Consumo de API REST y Visualización de Productos ---

    async function fetchProducts() {
        try {
            // Ejemplo de una API de productos genérica.
            // Puedes usar una API real si tienes acceso, o una de mock como JSONPlaceholder extendida con productos,
            // o una API como Fake Store API (https://fakestoreapi.com/products)
            const response = await fetch('https://fakestoreapi.com/products?limit=6'); // Obtener 6 productos de ejemplo
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            displayProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            productsContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar los productos en este momento.</p>';
        }
    }

    function displayProducts(products) {
        productsContainer.innerHTML = ''; // Limpiar productos existentes
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <h3>${product.title}</h3>
                <p>${product.description.substring(0, 100)}...</p>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart-btn" data-id="${product.id}" data-name="${product.title}" data-price="${product.price}">Añadir al Carrito</button>
            `;
            productsContainer.appendChild(productCard);
        });

        // Añadir event listeners a los botones "Añadir al Carrito"
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.dataset.id);
                const productName = event.target.dataset.name;
                const productPrice = parseFloat(event.target.dataset.price);
                addItemToCart({ id: productId, name: productName, price: productPrice });
            });
        });
    }

    // --- Validación de Formulario de Contacto ---

    function validateContactForm() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        if (name === '' || email === '' || message === '') {
            displayFormMessage('Por favor, completa todos los campos requeridos.', 'error');
            return false;
        }

        // Validación básica de formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            displayFormMessage('Por favor, ingresa un formato de correo electrónico válido.', 'error');
            return false;
        }
        return true;
    }

    function displayFormMessage(msg, type) {
        formMessage.textContent = msg;
        formMessage.classList.remove('hidden', 'success', 'error');
        formMessage.classList.add(type);
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000); // Ocultar mensaje después de 5 segundos
    }

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevenir el envío por defecto del formulario

        if (validateContactForm()) {
            const formData = new FormData(contactForm);
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    displayFormMessage('¡Gracias por tu mensaje! Nos pondremos en contacto pronto.', 'success');
                    contactForm.reset(); // Limpiar el formulario
                } else {
                    const data = await response.json();
                    if (Object.hasOwnProperty.call(data, 'errors')) {
                        displayFormMessage(data["errors"].map(error => error["message"]).join(", "), 'error');
                    } else {
                        displayFormMessage('Hubo un problema al enviar tu mensaje. Por favor, intenta de nuevo.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error al enviar el formulario:', error);
                displayFormMessage('Ocurrió un error de red. Por favor, intenta de nuevo más tarde.', 'error');
            }
        }
    });

    // --- Inicialización al cargar la página ---
    fetchProducts();
    updateCartDisplay(); // Mostrar el estado inicial del carrito
});