function Test(){    
    for (const dropdown of document.querySelectorAll(".dropSelectWrap")) {
        dropdown.addEventListener('click', function () {
            this.querySelector('.dropSelect').classList.toggle('open');
        })
    }

    for (const option of document.querySelectorAll(".dropSelectOption")) {
        option.addEventListener('click', function () {
            if (!this.classList.contains('dropSelectChosen')) {
                this.parentNode.querySelector('.dropSelectOption.dropSelectChosen').classList.remove('dropSelectChosen');
                this.classList.add('dropSelectChosen');
                this.closest('.dropSelect').querySelector('.dropSelectTrig span').textContent = this.textContent;
            }
        })
    }

    window.addEventListener('click', function (e) {
        for (const select of document.querySelectorAll('.dropSelect')) {
            if (!select.contains(e.target)) {
                select.classList.remove('open');
            }
        }
    });

    function selectOption(index) {
        var optionOnIdx = document.querySelector('.dropSelectOption:nth-child('+index+')');
      var optionSelected = document.querySelector('.dropSelectOption.dropSelectChosen');
      if (optionOnIdx !== optionSelected) {
        optionSelected.parentNode.querySelector('.dropSelectOption.dropSelectChosen').classList.remove('dropSelectChosen');
                optionOnIdx.classList.add('dropSelectChosen');
                optionOnIdx.closest('.dropSelect').querySelector('.dropSelectTrig span').textContent = optionOnIdx.textContent;
            }
    }
}