document.addEventListener('DOMContentLoaded', async () => {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const durationDisplay = document.getElementById('durationDisplay');
    const cameraGrid = document.getElementById('cameraGrid');

    const modal = document.getElementById('orderModal');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');

    const modalImages = document.getElementById('modalImages');
    const modalYoutube = document.getElementById('modalYoutube');
    const modalCalendar = document.getElementById('modalCalendar');
    const modalTitle = document.getElementById('modalTitle');
    const modalDuration = document.getElementById('modalDuration');
    const modalDates = document.getElementById('modalDates');
    const modalTotalPrice = document.getElementById('modalTotalPrice');
    const waBtn = document.getElementById('waBtn');

    let selectedProduct = null;
    let rentalDays = 0;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    startDateInput.value = today.toISOString().split('T')[0];
    endDateInput.value = tomorrow.toISOString().split('T')[0];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const updateDuration = () => {
        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);

        if (startDateInput.value && endDateInput.value) {
            endDateInput.min = startDateInput.value;
            const diffTime = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            rentalDays = diffDays <= 0 ? 1 : diffDays;
        } else {
            rentalDays = 0;
        }
        durationDisplay.textContent = rentalDays.toString();
    };

    startDateInput.addEventListener('change', updateDuration);
    endDateInput.addEventListener('change', updateDuration);

    updateDuration();

    const openModal = (product) => {
        if (rentalDays <= 0) {
            alert("Please select valid rental dates first.");
            return;
        }
        selectedProduct = product;

        modalImages.innerHTML = [product.image, ...(product.images ?? [])].map(imageUrl => {
            return `<a href="${imageUrl}" target="_blank" class="w-auto lg:w-full h-full lg:h-auto">
              <img src="${imageUrl}" loading="lazy" class="h-full w-full object-cover" />
            </a>`;
        }).join("");
        if (product.calendar_url) {
            modalCalendar.setAttribute("src", product.calendar_url ?? "");
            modalCalendar.classList.remove("hidden");
        } else {
            modalCalendar.classList.add("hidden");
        }
        if (product.youtube_url) {
            modalYoutube.setAttribute("href", product.youtube_url ?? "");
            modalYoutube.classList.remove("hidden");
        } else {
            modalYoutube.classList.add("hidden");
        }
        modalTitle.textContent = product.name;
        modalDuration.textContent = rentalDays.toString();

        const startStr = new Date(startDateInput.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const endStr = new Date(endDateInput.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        modalDates.textContent = `${startStr} - ${endStr}`;

        const total = parseInt(product.price) * rentalDays;
        modalTotalPrice.textContent = formatCurrency(total);

        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    };

    const closeModal = () => {
        modal.classList.add('opacity-0');
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');

        setTimeout(() => {
            modal.classList.add('hidden');
            selectedProduct = null;
        }, 300);
    };

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    waBtn.addEventListener('click', () => {
        if (!selectedProduct) return;

        const adminPhone = "6282257038056"; // Ganti dengan nomor asli
        const totalPrice = parseInt(selectedProduct.price) * rentalDays;

        const message = `Halo admin SoreAja! 📸\n\nSaya ingin menyewa:\n*${selectedProduct.name}*\n\nTanggal Pengambilan: ${startDateInput.value}\nTanggal Pengembalian: ${endDateInput.value}\nDurasi: ${rentalDays} Hari\n\nTotal Estimasi: *${formatCurrency(totalPrice)}*\n\nApakah unitnya tersedia?`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${adminPhone}?text=${encodedMessage}`, '_blank');
    });

    // Fetch and render cameras
    try {
        const response = await fetch('cameras.json');
        if (!response.ok) throw new Error('Failed to load cameras');
        const cameras = await response.json();

        if (cameras.length === 0) {
            cameraGrid.innerHTML = '<p class="text-red-200 text-center col-span-full">Katalog Kamera Kosong.</p>';
        }

        cameras.forEach(camera => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl overflow-hidden shadow-lg border border-red-900/10 flex flex-col group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1';

            card.innerHTML = `
                <div class="relative h-48 overflow-hidden bg-gray-100">
                    <img src="${camera.image}" alt="${camera.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div class="absolute top-3 right-3 bg-red-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">${formatCurrency(camera.pricePerDay)} / hari</div>
                </div>
                <div class="p-5 flex flex-col grow bg-white text-gray-900">
                    <h3 class="font-bold text-xl mb-2 text-red-950">${camera.name}</h3>
                    <p class="text-sm text-gray-600 mb-1 grow">${camera.description}</p>
                    ${camera.youtubeUrl ? `<a href="${camera.youtubeUrl}" class="mb-5 text-sm text-blue-500 underline" target="_blank">Tutorial Penggunaan</a>` : "<div class='mb-5'></div>"}
                    <button class="w-full bg-red-900 hover:bg-red-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 open-modal-btn">Sewa Sekarang</button>
                </div>
            `;

            const btn = card.querySelector('.open-modal-btn');
            btn.addEventListener('click', () => {
                openModal({
                    id: camera.id,
                    name: camera.name,
                    price: camera.pricePerDay,
                    image: camera.image,
                    images: camera.images,
                    youtube_url: camera.youtubeUrl,
                    calendar_url: camera.calendarUrl
                });
            });

            cameraGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading cameras:', error);
        cameraGrid.innerHTML = '<p class="text-red-200 text-center col-span-full">Gagal memuat katalog kamera.</p>';
    }
});