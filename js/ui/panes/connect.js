qwebirc.ui.Panes.Connect = {
  title: "Connect",
  command: function(session) { return null; },
  menuitem: function(session) { return null; }
};

qwebirc.ui.Panes.Connect.pclass = new Class({
  Implements: [Events],
  session: null,
  parent: null,
  connectCallback: null,
  nickBox: null,
  chanBox: null,

  initialize: function(session, w) {
    this.session = session;
    this.parent = w.lines;

    if (!conf.frontend.prompt
          && conf.frontend.initial_nick
          && conf.frontend.initial_chans)
      this.createConfirmBox();
    else
      this.createLoginBox(null);
  },

  connectChannel: function(channel) {
    if (conf.frontend.chan_autoconnect
        && (conf.frontend.initial_nick
         || (this.nickBox && this.nickBox.value))) {
      this.connect(channel);
      return true;
    }
    else {
      if (this.chanBox != null)
        this.chanBox.set("value", channel);
      else
        this.createLoginBox(channel);

      return false;
    }
  },

  connect: function(channel) {
    while(this.parent.childNodes.length > 0)
      this.parent.removeChild(this.parent.firstChild);

    var data = {};

    if (this.nickBox != null)
      data["nickname"] = this.nickBox.value;
    else
      data["nickname"] = conf.frontend.initial_nick;

    if (channel != null)
      data["autojoin"] = channel;
    else if (this.chanBox != null)
      data["autojoin"] = this.chanBox.value;
    else
      data["autojoin"] = conf.frontend.initial_chans;

    if (this.session.atheme.state) {
      data["authUser"] = this.session.atheme.user;
      data["authSecret"] = this.session.atheme.secret;
    }

    this.connectCallback(data);
  },

  /* Focus elem if we're not embedded in an iframe. This prevents stealing focus. */
  autoFocus: function(elem) {
    /* Accessing window.top might raise if we are iframed... */
    try {
      if (window.self === window.top) {
        elem.focus();
      }
    } catch (e) {}
  },

  createConfirmBox: function() {
    while(this.parent.childNodes.length > 0)
      this.parent.removeChild(this.parent.firstChild);

    var outerbox = new Element("table");
    outerbox.addClass("qwebirc-centrebox");
    this.parent.appendChild(outerbox);
    var tbody = new Element("tbody");
    outerbox.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    var td = new Element("td");
    tr.appendChild(td);

    var box = new Element("table");
    box.addClass("qwebirc-confirmbox");
    td.appendChild(box);

    var tbody = new Element("tbody");
    box.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr1");

    var text = new Element("td");
    tr.appendChild(text);

    var nick = new Element("b");
    nick.set("text", conf.frontend.initial_nick);

    var c = conf.frontend.initial_chans.split(" ")[0].split(",");

    for(var i=0;i<c.length;i++) {
      if((c.length > 1) && (i == c.length - 1)) {
        text.appendChild(document.createTextNode(" and "));
      } else if(i > 0) {
        text.appendChild(document.createTextNode(", "));
      }
      text.appendChild(new Element("b").set("text", c[i]));
    }

    if(!conf.frontend.initial_nick_rand) {
      text.appendChild(document.createTextNode(" as "));
      text.appendChild(nick);
    }

    text.appendChild(document.createTextNode(" click 'Connect'."));
    text.appendChild(new Element("br"));

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr2");

    var td = new Element("td");
    tr.appendChild(td);

    var form = new Element("form");
    td.appendChild(form);

    var yes = new Element("input", {"type": "submit", "value": "Connect"});
    form.appendChild(yes);
    this.autoFocus(yes);

    form.addEvent("submit", function(e) {
      new Event(e).stop();
      this.connect(null);
    }.bind(this));

  },

  createLoginBox: function(channel) {
    while(this.parent.childNodes.length > 0)
      this.parent.removeChild(this.parent.firstChild);

    var outerbox = new Element("table");
    outerbox.addClass("qwebirc-centrebox");
    this.parent.appendChild(outerbox);
    var tbody = new Element("tbody");
    outerbox.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    var td = new Element("td");
    tr.appendChild(td);

    var box = new Element("table");
    box.addClass("qwebirc-loginbox");
    td.appendChild(box);

    var tbody = new Element("tbody");
    box.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr1");

    var td = new Element("td");
    tr.appendChild(td);
    td.set("html", "<h1>Connect to " + conf.frontend.network_name + " Web Chat</h1>");

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr2");

    var td = new Element("td");
    tr.appendChild(td);

    var form = new Element("form");
    td.appendChild(form);

    var boxtable = new Element("table");
    form.appendChild(boxtable);

    var tbody = new Element("tbody");
    boxtable.appendChild(tbody); /* stupid IE */

    function createRow(label, e2, style) {
      var r = new Element("tr");
      tbody.appendChild(r);

      var d1 = new Element("td");
      if(label)
        d1.set("text", label);
      r.appendChild(d1);

      var d2 = new Element("td");
      r.appendChild(d2);

      if($defined(e2))
        d2.appendChild(e2);
      if($defined(style)) {
        r.setStyles(style);
        return [r, d2];
      }

      return d2;
    }

    var data = {"nickname": "webuser", "autojoin": "" };
    var user = new Element("input");
    var userRow = createRow("Username:", user, {})[0];
    var pass = new Element("input");
    pass.set("type", "password");
    var passRow = createRow("Password:", pass, {})[0];

    var connbutton = new Element("input", {"type": "submit"});
    connbutton.set("value", "Connect");
    var r = createRow(undefined, connbutton);

    form.addEvent("submit", function(e) {
      new Event(e).stop();

      if (!user.value) {
        alert("You must supply a username.");
        user.focus();
        return;
      }
      if (!pass.value) {
        alert("You must supply a password.");
        pass.focus();
        return;
      }

      var client = new XMLHttpRequest();
      var params = "username=" + encodeURIComponent(user.value) + "&password=" + encodeURIComponent(pass.value);
      client.open("POST", "/sasl/", false);
      client.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      client.setRequestHeader("Content-lenght", params.length);
      client.setRequestHeader("Connection", "close");
      client.send(params);
      var response = client.responseText;
      if(!response) {
        alert("Your supplied username or password does not match our user records.");
        user.focus();
        return;
      }

      this.session.atheme.state = true;
      this.session.atheme.user = user.value;
      this.session.atheme.secret = response; 

      data["authUser"] = this.session.atheme.user;
      data["authSecret"] = this.session.atheme.secret;
      data["serverPassword"] = user.value + ":" + pass.value;

      this.connectCallback(data);
    }.bind(this));

    this.autoFocus(this.user);
  }
});


