import axios from "axios";

export default class RegistrationForm {
  constructor() {
    this.form = document.querySelector("#registration-form");
    this.allFields = document.querySelectorAll("#registration-form .form-control");
    this.username = document.querySelector("#username-register");
    this.username.prevValue = "";
    this.username.isUnique = false;
    this.email = document.querySelector("#email-register");
    this.email.prevValue = "";
    this.email.isUnique = false;
    this.password = document.querySelector("#password-register");
    this.password.prevValue = "";
    this._csrf = document.querySelector('[name ="_csrf"]').value;

    this.insertValidationElements();
    this.events();
  }

  events() {
    this.username.addEventListener("keyup", () => {
      this.isDifferent(this.username, this.usernameHandler);
    });
    this.email.addEventListener("keyup", () => {
      this.isDifferent(this.email, this.emailHandler);
    });
    this.password.addEventListener("keyup", () => {
      this.isDifferent(this.password, this.passwordHandler);
    });
    this.username.addEventListener("blur", () => {
      this.isDifferent(this.username, this.usernameHandler);
    });
    this.email.addEventListener("blur", () => {
      this.isDifferent(this.email, this.emailHandler);
    });
    this.password.addEventListener("blur", () => {
      this.isDifferent(this.password, this.passwordHandler);
    });
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.formSubmitHandler();
    });
  }

  insertValidationElements() {
    this.allFields.forEach((element) => {
      element.insertAdjacentHTML(
        "afterend",
        `
          <div class="alert alert-danger small liveValidateMessage">

          </div>
        `
      );
    });
  }

  isDifferent(element, handler) {
    if (element.prevValue != element.value) {
      handler.call(this);
    }
    element.prevValue = element.value;
  }

  usernameHandler() {
    this.hideValidationError(this.username);
    clearTimeout(this.username.timer);
    this.usernameImmediatly();
    this.username.timer = setTimeout(() => {
      this.usernameDelayed();
    }, 700);
  }

  usernameImmediatly() {
    if (this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(this.username, "Username can only contain letters and numbers");
    }
    if (this.username.value.length > 30) {
      this.showValidationError(this.username, "Username can not exceed 30 characters");
    }
  }

  usernameDelayed() {
    if (this.username.value.length < 3) {
      this.showValidationError(this.username, "Username must be at least 3 characters");
    }
    if (!this.username.errors) {
      axios
        .post("/doesUsernameExist", { _csrf: this._csrf, username: this.username.value })
        .then((response) => {
          if (response.data) {
            this.showValidationError(this.username, "This username is already taken");
            this.username.isUnique = false;
          } else {
            this.username.isUnique = true;
          }
        })
        .catch(() => console.log("Please, try again later"));
    }
  }

  emailHandler() {
    this.hideValidationError(this.email);
    clearTimeout(this.email.timer);
    this.email.timer = setTimeout(() => {
      this.emailDelayed();
    }, 700);
  }

  emailDelayed() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(this.email, "You must provide a valid email address");
    }
    if (!this.email.errors) {
      axios
        .post("/doesEmailExist", { _csrf: this._csrf, email: this.email.value })
        .then((response) => {
          if (response.data) {
            this.showValidationError(this.email, "This email is already registered");
            this.email.isUnique = false;
          } else {
            this.email.isUnique = true;
            this.hideValidationError(this.email);
          }
        })
        .catch(() => console.log("Please, try again later"));
    }
  }

  passwordHandler() {
    this.hideValidationError(this.password);
    clearTimeout(this.password.timer);
    this.passwordImmediatly();
    this.password.timer = setTimeout(() => {
      this.passwordDelayed();
    }, 700);
  }

  passwordImmediatly() {
    if (this.password.value.length > 50) {
      this.showValidationError(this.password, "Password cannot exceed 50 characters");
    }
  }

  passwordDelayed() {
    if (this.password.value.length < 8) {
      this.showValidationError(this.password, "Password must be at least 8 characters");
    }
  }

  formSubmitHandler() {
    this.usernameImmediatly();
    this.usernameDelayed();
    this.emailDelayed();
    this.passwordImmediatly();
    this.passwordDelayed();
    if (
      this.username.isUnique &&
      this.email.isUnique &&
      !this.username.errors &&
      !this.email.errors &&
      !this.password.errors
    ) {
      this.form.submit();
    }
  }

  showValidationError(element, message) {
    element.nextElementSibling.innerHTML = message;
    element.nextElementSibling.classList.add("liveValidateMessage--visible");
    element.errors = true;
  }

  hideValidationError(element) {
    element.nextElementSibling.classList.remove("liveValidateMessage--visible");
    element.errors = false;
  }
}
