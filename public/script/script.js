document.addEventListener('DOMContentLoaded', openModal, false);
function openModal() {
        [].forEach.call(document.querySelectorAll('.prefix-open, .prefix-close'), function(item) {
        item.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('#Modal').classList.toggle('active');
        });
    });
}
