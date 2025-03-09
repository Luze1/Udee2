// Username dropdown functionality
function toggleDropdown() {
    document.getElementById("usernameDropdown").classList.toggle("show");
}

// Custom dropdown functionality
function toggleCustomDropdown(element) {
    element.classList.toggle('active');
    
    var dropdownList = element.nextElementSibling;
    
    var allDropdowns = document.querySelectorAll('.dropdown-list');
    allDropdowns.forEach(function(dropdown) {
        if (dropdown !== dropdownList && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            dropdown.previousElementSibling.classList.remove('active');
        }
    });
    
    if (!dropdownList.classList.contains('show')) {
        dropdownList.classList.add('show');
    } else {
        dropdownList.classList.remove('show');
    }
}

function selectOption(option) {
    var selectedText = option.textContent;
    var dropdownList = option.parentElement;
    var dropdownSelect = dropdownList.previousElementSibling;
    
    dropdownSelect.textContent = selectedText;
    
    var options = dropdownList.querySelectorAll('.dropdown-option');
    options.forEach(function(opt) {
        opt.classList.remove('selected');
    });
    
    option.classList.add('selected');
    
    setTimeout(function() {
        dropdownList.classList.remove('show');
        dropdownSelect.classList.remove('active');
    }, 150);
    
    loadRooms();
}

// Close the dropdowns if the user clicks outside
window.onclick = function(event) {
    if (!event.target.matches('.username-dropdown') && !event.target.matches('.username-dropdown span')) {
        var dropdown = document.getElementById("usernameDropdown");
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
    
    if (!event.target.matches('.dropdown-select') && !event.target.matches('.dropdown-option')) {
        var dropdowns = document.querySelectorAll('.dropdown-list');
        var selects = document.querySelectorAll('.dropdown-select');
        
        dropdowns.forEach(function(dropdown) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        });
        
        selects.forEach(function(select) {
            if (select.classList.contains('active')) {
                select.classList.remove('active');
            }
        });
    }
}

// Load rooms from API
function loadRooms() {
    const floorsContainer = document.getElementById("floors-container");
    floorsContainer.innerHTML = "<div class='loading-indicator'>กำลังโหลดข้อมูล...</div>";
    
    const dormitoryText = document.querySelector('.dropdown-container:nth-child(1) .dropdown-select').textContent;
    let dormitoryId = null;
    
    if (dormitoryText.includes('ตึก A')) {
        dormitoryId = "D001";
    } else if (dormitoryText.includes('ตึก B')) {
        dormitoryId = "D002";
    } else if (dormitoryText.includes('ตึก C')) {
        dormitoryId = "D003";
    }
    
    const floorText = document.querySelector('.dropdown-container:nth-child(2) .dropdown-select').textContent;
    let floor = "";
    
    if (floorText.includes('ชั้น 1')) {
        floor = "1";
    } else if (floorText.includes('ชั้น 2')) {
        floor = "2";
    } else if (floorText.includes('ชั้น 3')) {
        floor = "3";
    }

    const roomSearch = document.getElementById("roomSearch").value.trim();

    let apiUrl = `/api/rooms?`;
    
    if (dormitoryId) {
        apiUrl += `dormitory_id=${dormitoryId}&`;
    }
    
    if (floor) {
        apiUrl += `floor=${floor}&`;
    }
    if (roomSearch) {
        apiUrl += `room_id=${roomSearch}&`;
    }
    
    if (apiUrl.endsWith('&')) {
        apiUrl = apiUrl.slice(0, -1);
    }

    console.log("🔍 กำลังค้นหาห้อง:", apiUrl);

    axios.get(apiUrl)
        .then(response => {
            const rooms = response.data;
            
            if (dormitoryText === "ทุกตึก") {
                displayRoomsByDormitory(rooms);
            } else {
                displayRooms(rooms);
            }
        })
        .catch(error => {
            console.error("❌ Error loading rooms:", error);
            floorsContainer.innerHTML = "<div class='error-message'>เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</div>";
        });
}

// Display rooms in HTML
function displayRooms(roomsData) {
    const floorsContainer = document.getElementById("floors-container");
    floorsContainer.innerHTML = "";

    if (!roomsData || Object.keys(roomsData).length === 0) {
        floorsContainer.innerHTML = "<div class='no-results'>ไม่พบห้องที่ค้นหา</div>";
        return;
    }

    const sortedFloors = Object.keys(roomsData).sort((a, b) => parseInt(a) - parseInt(b));

    sortedFloors.forEach(floor => {
        const floorSection = document.createElement("div");
        floorSection.classList.add("floor-section");
        floorSection.innerHTML = `
            <div class="floor-title">ชั้นที่ ${floor}</div>
            <div class="room-grid"></div>
        `;

        const roomGrid = floorSection.querySelector(".room-grid");
        const rooms = roomsData[floor];

        rooms.sort((a, b) => a.room_id.localeCompare(b.room_id));

        rooms.forEach(room => {
            const roomButton = document.createElement("button");
            roomButton.classList.add("room-item");
            roomButton.classList.add(room.tenant_ID ? "occupied" : "available");

            roomButton.innerHTML = `
                <div class="room-status">
                    <img src="${room.tenant_picture || '/image/default-profile.png'}" alt="User" class="room-user-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="room-status-icon"></div>
                </div>
                <h3>${room.room_id}</h3>
            `;

            roomButton.onclick = () => openPopup(
                room.room_id,
                room.room_status,
                room.tenant_status,
                room.telephone,
                room.tenant_ID,
                room.tenant_picture,
                room.firstName,
                room.lastName,
                room.room_type_name
            );

            roomGrid.appendChild(roomButton);
        });

        floorsContainer.appendChild(floorSection);
    });
}

// Display rooms by dormitory for "ทุกตึก" option
function displayRoomsByDormitory(roomsData) {
    const floorsContainer = document.getElementById("floors-container");
    floorsContainer.innerHTML = "";

    if (!roomsData || Object.keys(roomsData).length === 0) {
        floorsContainer.innerHTML = "<div class='no-results'>ไม่พบห้องที่ค้นหา</div>";
        return;
    }

    const dormitories = {};

    Object.keys(roomsData).forEach(floor => {
        roomsData[floor].forEach(room => {
            const dormId = room.dormitory_id;
            const dormName = getDormitoryName(dormId);

            if (!dormitories[dormName]) {
                dormitories[dormName] = {};
            }

            if (!dormitories[dormName][floor]) {
                dormitories[dormName][floor] = [];
            }

            dormitories[dormName][floor].push(room);
        });
    });

    Object.keys(dormitories).sort().forEach(dormName => {
        const dormitorySection = document.createElement("div");
        dormitorySection.classList.add("dormitory-section");
        dormitorySection.innerHTML = `<h2 class="dormitory-title">${dormName}</h2>`;

        const floors = Object.keys(dormitories[dormName]).sort((a, b) => parseInt(a) - parseInt(b));

        floors.forEach(floor => {
            const floorSection = document.createElement("div");
            floorSection.classList.add("floor-section");
            floorSection.innerHTML = `
                <div class="floor-title">ชั้นที่ ${floor}</div>
                <div class="room-grid"></div>
            `;

            const roomGrid = floorSection.querySelector(".room-grid");
            const rooms = dormitories[dormName][floor];

            rooms.sort((a, b) => a.room_id.localeCompare(b.room_id));

            rooms.forEach(room => {
                const roomButton = document.createElement("button");
                roomButton.classList.add("room-item");
                roomButton.classList.add(room.tenant_ID ? "occupied" : "available");

                roomButton.innerHTML = `
                    <div class="room-status">
                        <img src="${room.tenant_picture || '/image/default-profile.png'}" alt="User" class="room-user-image"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div class="room-status-icon"></div>
                    </div>
                    <h3>${room.room_id}</h3>
                `;

                roomButton.onclick = () => openPopup(
                    room.room_id,
                    room.room_status || (room.tenant_ID ? "มีผู้เช่า" : "ว่าง"),
                    room.tenant_status || (room.tenant_ID ? "อาศัยอยู่" : "ไม่มีผู้เช่า"),
                    room.telephone || "ไม่มีข้อมูล",
                    room.tenant_ID || null,
                    room.tenant_picture || '/image/default-profile.png',
                    room.firstName || '',
                    room.lastName || '',
                    room.room_type_name
                );

                roomGrid.appendChild(roomButton);
            });

            dormitorySection.appendChild(floorSection);
        });

        floorsContainer.appendChild(dormitorySection);
    });
}

// Convert dormitory ID to name
function getDormitoryName(dormId) {
    switch (dormId) {
        case 'D001': return 'ตึก A';
        case 'D002': return 'ตึก B';
        case 'D003': return 'ตึก C';
        default: return `ตึก ${dormId}`;
    }
}

// Open popup to show room details
function openPopup(roomId, roomStatus, tenantStatus, telephone, tenantId, tenantPicture, firstName, lastName, roomTypeName) {
    const popup = document.getElementById("profilePopup");
    const popupRoomNumber = document.getElementById("popup-room-number");
    const popupTenantName = document.getElementById("popup-tenant-name");
    const popupRoomStatus = document.getElementById("popup-room-status");
    // const popupTenantStatus = document.getElementById("popup-tenant-status");
    const popupPhone = document.getElementById("popup-phone");
    const popupRoomType = document.getElementById("popup-room-type");

    // ถ้ายังไม่มี popupRoomType ให้สร้าง
    if (!popupRoomType) {
        const popupBody = popup.querySelector(".popup-body .profile-info");
        const roomTypeElement = document.createElement("p");
        roomTypeElement.id = "popup-room-type";
        roomTypeElement.innerHTML = `<strong>ประเภทห้อง:</strong> <span></span>`;
        popupBody.appendChild(roomTypeElement);
    }

    popupRoomNumber.textContent = roomId;
    popupTenantName.textContent = `${firstName || ''} ${lastName || ''}`;
    popupRoomStatus.textContent = roomStatus || (tenantId ? "มีผู้เช่า" : "ว่าง");
    // popupTenantStatus.textContent = tenantStatus || (tenantId ? "อาศัยอยู่" : "ไม่มีผู้เช่า");
    popupPhone.textContent = telephone || "ไม่มีข้อมูล";
    document.getElementById("popup-room-type").querySelector("span").textContent = roomTypeName || "ไม่ระบุ";

    const deleteTenantBtn = document.getElementById("delete-tenant-btn");
    const hasTenant = tenantId && tenantId !== "null" && tenantId.trim() !== "";

    if (hasTenant) {
        console.log("✅ ห้องมีผู้เช่า");
        deleteTenantBtn.innerText = "ลบผู้เช่า";
        deleteTenantBtn.classList.add("btn-danger");
        deleteTenantBtn.classList.remove("btn-disabled");
        deleteTenantBtn.onclick = function () {
            confirmRemoveTenant(roomId, tenantId);
        };
    } else {
        console.log("❌ ห้องไม่มีผู้เช่า");
        deleteTenantBtn.innerText = "ไม่มีผู้เช่า";
        deleteTenantBtn.classList.add("btn-disabled");
        deleteTenantBtn.classList.remove("btn-danger");
        deleteTenantBtn.onclick = function () {
            alert("ห้องนี้ไม่มีผู้เช่า");
        };
    }

    popup.style.display = "flex"; // เปลี่ยนจาก "block" เป็น "flex"
    setTimeout(() => {
        popup.classList.add("show");
    }, 10);
}

// Confirm and remove tenant
function confirmRemoveTenant(roomNumber, tenantID) {
    console.log("Remove tenant debug:", { roomNumber, tenantID });
    
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้เช่าออกจากห้อง ${roomNumber} ?`)) {
        axios.post('/api/remove-tenant', { 
            room_id: roomNumber,
            tenant_ID: tenantID 
        })
        .then(response => {
            alert(response.data.message);
            closePopup();
            loadRooms(); // Reload rooms after removal
        })
        .catch(error => {
            console.error("❌ เกิดข้อผิดพลาด:", error);
            alert("เกิดข้อผิดพลาดในการลบผู้เช่า");
        });
    }
}

// Close popup
function closePopup() {
    var popupContainer = document.getElementById("profilePopup");
    popupContainer.classList.remove("show");
    popupContainer.classList.add("hide");

    setTimeout(() => {
        popupContainer.style.display = "none";
        popupContainer.classList.remove("hide");
    }, 300);
}

// Delete tenant (alternative function)
// ✅ ฟังก์ชันลบผู้เช่า
function deleteTenant(tenantId, roomId) {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบผู้เช่าคนนี้? การกระทำนี้จะลบสัญญาและปล่อยห้องด้วย")) {
        axios.delete(`/api/tenant/${tenantId}`, { data: { roomId } }) // ส่ง roomId ไปด้วย
            .then(response => {
                if (response.data.success) {
                    alert("ลบผู้เช่าสำเร็จ");
                    // รีเฟรชตารางหรือลบแถวจาก DOM
                    const row = document.querySelector(`tr[data-tenant-id="${tenantId}"]`);
                    if (row) row.remove();
                    loadTenantStatus(); // โหลดข้อมูลใหม่ (ถ้ามีฟังก์ชันนี้)
                }
            })
            .catch(error => {
                console.error("❌ Error deleting tenant:", error.response.data);
                alert(error.response.data.message || "เกิดข้อผิดพลาดในการลบผู้เช่า");
            });
    }
}

function loadTenantStatus() {
    axios.get('/api/tenant-status')
        .then(response => {
            const tenantStatusTable = document.getElementById("tenantStatusTable");
            tenantStatusTable.innerHTML = ""; // ล้างตารางก่อน
            response.data.forEach(tenant => {
                const row = document.createElement("tr");
                row.setAttribute("data-tenant-id", tenant.tenant_ID);
                row.innerHTML = `
                    <td>${tenant.tenant_ID}</td>
                    <td>${tenant.firstName}</td>
                    <td>${tenant.lastName}</td>
                    <td>${tenant.room_id}</td>
                    <td>${tenant.room_status}</td>
                    <td><button onclick="deleteTenant('${tenant.tenant_ID}', '${tenant.room_id}')">ลบ</button></td>
                `;
                tenantStatusTable.appendChild(row);
            });
        })
        .catch(error => console.error("❌ Error fetching tenant status:", error));
}

// Handle room status change
function handleRoomStatusChange() {
    const roomStatusDropdown = document.getElementById("roomStatus");
    const selectedStatus = roomStatusDropdown.value;
    const roomId = document.getElementById("popup-room-number").innerText; 

    if (selectedStatus === "ว่าง") {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนสถานะห้องเป็นว่าง? ข้อมูลผู้เช่าจะถูกลบออก!")) {
            axios.post('/api/update-room-status', {
                room_id: roomId,
                tenant_ID: null
            })
            .then(response => {
                alert("เปลี่ยนสถานะห้องเป็นว่างเรียบร้อยแล้ว!");
                loadRooms();
                closePopup();
            })
            .catch(error => {
                console.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ:", error);
                alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            });
        } else {
            roomStatusDropdown.value = "มีผู้เช่า";
        }
    }
}

// View contract details
function viewContract() {
    const roomNumber = document.getElementById("popup-room-number").innerText;
    window.location.href = `/ContractDetail?room_id=${roomNumber}`;
}

// Event listener when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    const roomSearch = document.getElementById("roomSearch");
    if (roomSearch) {
        roomSearch.addEventListener("input", function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                loadRooms();
            }, 300);
        });
    }
    
    loadRooms(); // Load initial rooms

    // CSS for loading indicator, error message, and no results
    const style = document.createElement('style');
    style.textContent = `
        .loading-indicator, .error-message, .no-results {
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            font-size: 16px;
        }
        .loading-indicator {
            color: #0066cc;
        }
        .error-message {
            color: #cc0000;
        }
        .no-results {
            color: #666;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
});