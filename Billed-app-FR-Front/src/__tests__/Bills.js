/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon");
    });
    //--------------------------------------------------------------------------------------
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    //--------------------------------------------------------------------------------------
    describe("when an error occurs on BillsUi render", () => {
      it("Should shows error message", () => {
        const html = BillsUI({ error: true });
        document.body.innerHTML = html;
        const errorMessage = screen.getByTestId("error-message");
        expect(errorMessage).toBeTruthy();
      });
    });

    //--------------------------------------------------------------------------------------
    describe("when loading occurs on BillsUi render", () => {
      it("Should shows loading message", () => {
        const html = BillsUI({ loading: true });
        document.body.innerHTML = html;
        expect(screen.getAllByText("Loading...")).toBeTruthy();
      });
    });

    //--------------------------------------------------------------------------------------

    describe("When i Clicked on new Bill button", () => {
      it("Should show the newBill page", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        document.body.innerHTML = BillsUI({ data: [] });

        const bills = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const newBillBtn = screen.getByTestId("btn-new-bill");
        const handleClickNewBillMock = jest.fn(() => bills.handleClickNewBill);
        newBillBtn.addEventListener("click", handleClickNewBillMock);
        fireEvent.click(newBillBtn);

        expect(handleClickNewBillMock).toHaveBeenCalled();
        expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      });
    });
    // //--------------------------------------------------------------------------------------
    describe("When I click on the eye icon", () => {
      it("Should display the modal", () => {
        const html = BillsUI({
          data: bills,
        });
        document.body.innerHTML = html;

        const allBills = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        $.fn.modal = jest.fn();

        const eyeIcon = screen.getAllByTestId("icon-eye")[0];
        const modale = document.getElementById("modaleFile");

        const handleClickIconEye = jest.fn(() => allBills.handleClickIconEye);

        eyeIcon.addEventListener("click", handleClickIconEye);
        fireEvent.click(eyeIcon);

        expect(handleClickIconEye).toHaveBeenCalled();

        expect(modale).toBeTruthy();
      });
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as employee", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "employee", email: "employee@test.tld" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      await waitFor(() => screen.getByText("Mes notes de frais"));

      expect(screen.getByText("Mes notes de frais")).toBeTruthy();

      const getBillsMock = jest.fn(() => bills.getBills());
      const billsMock = await getBillsMock();

      expect(getBillsMock).toHaveBeenCalled();
      expect(billsMock.length).toBe(4);
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "employee",
            email: "employee@test.tld",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
