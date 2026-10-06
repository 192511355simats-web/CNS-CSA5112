using System;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using System.Collections.Generic;

namespace CustomAssemblyStudio
{
    public class HttpServer
    {
        private static Dictionary<string, byte[]> _embeddedFiles = null;
        private static readonly object _embeddedLock = new object();

        public static Dictionary<string, byte[]> EmbeddedFiles
        {
            get
            {
                LoadEmbeddedAssets();
                return _embeddedFiles;
            }
        }

        public static void LoadEmbeddedAssets()
        {
            if (_embeddedFiles != null) return;
            lock (_embeddedLock)
            {
                if (_embeddedFiles != null) return;
                _embeddedFiles = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
                try
                {
                    using (Stream stream = typeof(Program).Assembly.GetManifestResourceStream("EmbeddedAssets"))
                    {
                        if (stream != null)
                        {
                            using (ZipArchive archive = new ZipArchive(stream, ZipArchiveMode.Read))
                            {
                                foreach (ZipArchiveEntry entry in archive.Entries)
                                {
                                    if (string.IsNullOrEmpty(entry.Name)) continue;
                                    using (Stream entryStream = entry.Open())
                                    using (MemoryStream ms = new MemoryStream())
                                    {
                                        entryStream.CopyTo(ms);
                                        string key = entry.FullName.Replace('\\', '/').TrimStart('/');
                                        _embeddedFiles[key] = ms.ToArray();
                                    }
                                }
                            }
                        }
                    }
                }
                catch { }
            }
        }
        private HttpListener _listener;
        private Thread _listenThread;
        private bool _isRunning;
        private string _baseDirectory;
        private int _port;
        private long _requestCount;
        private DateTime _startTime;

        public int Port { get { return _port; } }
        public bool IsRunning { get { return _isRunning; } }
        public long RequestCount { get { return Interlocked.Read(ref _requestCount); } }
        public TimeSpan Uptime { get { return DateTime.Now - _startTime; } }

        public event Action<string> OnLog;

        public HttpServer(string baseDirectory, int startingPort)
        {
            _baseDirectory = baseDirectory;
            _port = startingPort;
        }

        public bool Start()
        {
            int maxAttempts = 20;
            for (int i = 0; i < maxAttempts; i++)
            {
                int testPort = _port + i;
                try
                {
                    _listener = new HttpListener();
                    _listener.Prefixes.Add(string.Format("http://127.0.0.1:{0}/", testPort));
                    _listener.Start();
                    _port = testPort;
                    _isRunning = true;
                    _startTime = DateTime.Now;

                    _listenThread = new Thread(ListenLoop);
                    _listenThread.IsBackground = true;
                    _listenThread.Name = "HttpServerThread";
                    _listenThread.Start();

                    Log(string.Format("Server successfully initialized on port {0}", _port));
                    return true;
                }
                catch (Exception ex)
                {
                    Log(string.Format("Port {0} not available ({1}), trying next...", testPort, ex.Message));
                    if (_listener != null)
                    {
                        try { _listener.Close(); } catch { }
                    }
                }
            }
            return false;
        }

        public void Stop()
        {
            _isRunning = false;
            if (_listener != null)
            {
                try
                {
                    _listener.Stop();
                    _listener.Close();
                }
                catch { }
            }
        }

        private void ListenLoop()
        {
            while (_isRunning && _listener != null && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    Interlocked.Increment(ref _requestCount);
                    ThreadPool.QueueUserWorkItem(delegate
                    {
                        HandleRequest(context);
                    });
                }
                catch
                {
                    if (!_isRunning) break;
                }
            }
        }

        private void HandleRequest(HttpListenerContext context)
        {
            if (context == null) return;
            try
            {
                HttpListenerRequest request = context.Request;
                HttpListenerResponse response = context.Response;

                string rawPath = request.Url.LocalPath.TrimStart('/');
                if (string.IsNullOrEmpty(rawPath))
                {
                    rawPath = "index.html";
                }

                string decodedPath = Uri.UnescapeDataString(rawPath).Replace('/', Path.DirectorySeparatorChar);
                string targetFile = Path.Combine(_baseDirectory, decodedPath);
                string fullTarget = Path.GetFullPath(targetFile);

                // Security check: ensure target remains within baseDirectory
                if (!fullTarget.StartsWith(Path.GetFullPath(_baseDirectory), StringComparison.OrdinalIgnoreCase))
                {
                    response.StatusCode = 403;
                    byte[] forbidden = Encoding.UTF8.GetBytes("403 Forbidden");
                    response.OutputStream.Write(forbidden, 0, forbidden.Length);
                    response.OutputStream.Close();
                    return;
                }

                byte[] buffer = null;
                string extension = null;

                if (File.Exists(fullTarget))
                {
                    buffer = File.ReadAllBytes(fullTarget);
                    extension = Path.GetExtension(fullTarget);
                }
                else
                {
                    LoadEmbeddedAssets();
                    string assetKey = rawPath.Replace('\\', '/').TrimStart('/');
                    if (_embeddedFiles != null && _embeddedFiles.ContainsKey(assetKey))
                    {
                        buffer = _embeddedFiles[assetKey];
                        extension = Path.GetExtension(assetKey);
                    }
                }

                if (buffer != null)
                {
                    response.ContentType = GetMimeType(extension);
                    response.ContentLength64 = buffer.Length;
                    response.StatusCode = 200;
                    response.AddHeader("Access-Control-Allow-Origin", "*");
                    response.AddHeader("Cache-Control", "no-cache");
                    response.OutputStream.Write(buffer, 0, buffer.Length);
                }
                else
                {
                    response.StatusCode = 404;
                    byte[] notFound = Encoding.UTF8.GetBytes("404 Not Found: " + rawPath);
                    response.ContentLength64 = notFound.Length;
                    response.ContentType = "text/plain";
                    response.OutputStream.Write(notFound, 0, notFound.Length);
                }

                response.OutputStream.Close();
            }
            catch
            {
                try { context.Response.Close(); } catch { }
            }
        }

        private string GetMimeType(string extension)
        {
            if (string.IsNullOrEmpty(extension)) return "application/octet-stream";
            switch (extension.ToLowerInvariant())
            {
                case ".html":
                case ".htm": return "text/html; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".txt": return "text/plain; charset=utf-8";
                case ".wasm": return "application/wasm";
                case ".woff2": return "font/woff2";
                case ".woff": return "font/woff";
                case ".ttf": return "font/ttf";
                default: return "application/octet-stream";
            }
        }

        private void Log(string message)
        {
            if (OnLog != null) OnLog(message);
        }
    }

    public class StudioForm : Form
    {
        private HttpServer _server;
        private NotifyIcon _notifyIcon;
        private ContextMenuStrip _trayMenu;
        private System.Windows.Forms.Timer _statusTimer;

        private Label _lblStatusTitle;
        private Label _lblStatusDesc;
        private Label _lblPortValue;
        private Label _lblRequestsValue;
        private Label _lblUptimeValue;
        private Button _btnLaunchStudio;
        private Button _btnOpenBrowser;
        private Button _btnOpenFolder;
        private Button _btnCopyUrl;
        private Button _btnMinimize;
        private Button _btnExit;

        public StudioForm(HttpServer server)
        {
            _server = server;
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Custom Assembly Studio - Desktop Control Center";
            this.ClientSize = new Size(540, 420);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(11, 15, 25);
            this.ForeColor = Color.FromArgb(241, 245, 249);
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Try load icon
            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.ico");
            if (File.Exists(iconPath))
            {
                try
                {
                    this.Icon = new Icon(iconPath);
                }
                catch { }
            }
            else
            {
                try
                {
                    if (HttpServer.EmbeddedFiles.ContainsKey("app.ico"))
                    {
                        using (MemoryStream ms = new MemoryStream(HttpServer.EmbeddedFiles["app.ico"]))
                        {
                            this.Icon = new Icon(ms);
                        }
                    }
                }
                catch { }
            }

            // Top Header Panel
            Panel topPanel = new Panel();
            topPanel.Dock = DockStyle.Top;
            topPanel.Height = 85;
            topPanel.BackColor = Color.FromArgb(15, 23, 42);
            topPanel.Paint += delegate(object sender, PaintEventArgs e)
            {
                using (Pen borderPen = new Pen(Color.FromArgb(30, 41, 59), 1))
                {
                    e.Graphics.DrawLine(borderPen, 0, 84, topPanel.Width, 84);
                }
                using (Pen glowPen = new Pen(Color.FromArgb(56, 189, 248), 2))
                {
                    e.Graphics.DrawLine(glowPen, 0, 0, topPanel.Width, 0);
                }
            };
            this.Controls.Add(topPanel);

            Label titleLabel = new Label();
            titleLabel.Text = "CUSTOM ASSEMBLY STUDIO";
            titleLabel.Font = new Font("Segoe UI", 12f, FontStyle.Bold);
            titleLabel.ForeColor = Color.FromArgb(56, 189, 248);
            titleLabel.Location = new Point(20, 18);
            titleLabel.AutoSize = true;
            topPanel.Controls.Add(titleLabel);

            Label subTitleLabel = new Label();
            subTitleLabel.Text = "CapStone Project: Compiler Pipeline & Virtual CPU Emulator Engine";
            subTitleLabel.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            subTitleLabel.ForeColor = Color.FromArgb(148, 163, 184);
            subTitleLabel.Location = new Point(21, 46);
            subTitleLabel.AutoSize = true;
            topPanel.Controls.Add(subTitleLabel);

            // Main Status Box
            Panel statusBox = new Panel();
            statusBox.Location = new Point(20, 105);
            statusBox.Size = new Size(500, 110);
            statusBox.BackColor = Color.FromArgb(19, 27, 46);
            statusBox.Paint += delegate(object sender, PaintEventArgs e)
            {
                using (Pen boxPen = new Pen(Color.FromArgb(30, 41, 59), 1))
                {
                    e.Graphics.DrawRectangle(boxPen, 0, 0, statusBox.Width - 1, statusBox.Height - 1);
                }
                // Green indicator dot
                using (SolidBrush dotBrush = new SolidBrush(Color.FromArgb(34, 197, 94)))
                {
                    e.Graphics.FillEllipse(dotBrush, 20, 20, 12, 12);
                }
            };
            this.Controls.Add(statusBox);

            _lblStatusTitle = new Label();
            _lblStatusTitle.Text = "EXECUTION ENGINE ACTIVE";
            _lblStatusTitle.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            _lblStatusTitle.ForeColor = Color.FromArgb(34, 197, 94);
            _lblStatusTitle.Location = new Point(40, 16);
            _lblStatusTitle.AutoSize = true;
            statusBox.Controls.Add(_lblStatusTitle);

            _lblStatusDesc = new Label();
            _lblStatusDesc.Text = string.Format("Local HTTP Host: http://127.0.0.1:{0}/", _server.Port);
            _lblStatusDesc.Font = new Font("Consolas", 9.5f, FontStyle.Regular);
            _lblStatusDesc.ForeColor = Color.FromArgb(226, 232, 240);
            _lblStatusDesc.Location = new Point(40, 42);
            _lblStatusDesc.AutoSize = true;
            statusBox.Controls.Add(_lblStatusDesc);

            // Metrics row
            Label lblPortKey = new Label();
            lblPortKey.Text = "PORT:";
            lblPortKey.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            lblPortKey.ForeColor = Color.FromArgb(148, 163, 184);
            lblPortKey.Location = new Point(40, 75);
            lblPortKey.AutoSize = true;
            statusBox.Controls.Add(lblPortKey);

            _lblPortValue = new Label();
            _lblPortValue.Text = _server.Port.ToString();
            _lblPortValue.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            _lblPortValue.ForeColor = Color.FromArgb(56, 189, 248);
            _lblPortValue.Location = new Point(80, 75);
            _lblPortValue.AutoSize = true;
            statusBox.Controls.Add(_lblPortValue);

            Label lblReqKey = new Label();
            lblReqKey.Text = "REQUESTS:";
            lblReqKey.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            lblReqKey.ForeColor = Color.FromArgb(148, 163, 184);
            lblReqKey.Location = new Point(140, 75);
            lblReqKey.AutoSize = true;
            statusBox.Controls.Add(lblReqKey);

            _lblRequestsValue = new Label();
            _lblRequestsValue.Text = "0";
            _lblRequestsValue.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            _lblRequestsValue.ForeColor = Color.FromArgb(192, 132, 252);
            _lblRequestsValue.Location = new Point(208, 75);
            _lblRequestsValue.AutoSize = true;
            statusBox.Controls.Add(_lblRequestsValue);

            Label lblUpKey = new Label();
            lblUpKey.Text = "UPTIME:";
            lblUpKey.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            lblUpKey.ForeColor = Color.FromArgb(148, 163, 184);
            lblUpKey.Location = new Point(270, 75);
            lblUpKey.AutoSize = true;
            statusBox.Controls.Add(lblUpKey);

            _lblUptimeValue = new Label();
            _lblUptimeValue.Text = "00:00:00";
            _lblUptimeValue.Font = new Font("Segoe UI", 8f, FontStyle.Bold);
            _lblUptimeValue.ForeColor = Color.FromArgb(245, 158, 11);
            _lblUptimeValue.Location = new Point(325, 75);
            _lblUptimeValue.AutoSize = true;
            statusBox.Controls.Add(_lblUptimeValue);

            // Primary Button: Launch Studio in App Mode
            _btnLaunchStudio = CreateStyledButton("🚀  Launch Studio Window (App Mode)", Color.FromArgb(37, 99, 235), Color.FromArgb(59, 130, 246), 20, 230, 498, 44);
            _btnLaunchStudio.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            _btnLaunchStudio.Click += delegate { LaunchStudioAppMode(); };
            this.Controls.Add(_btnLaunchStudio);

            // Row 2 Buttons: Default Browser & Copy URL
            _btnOpenBrowser = CreateStyledButton("🌐 Open in Default Browser", Color.FromArgb(30, 41, 59), Color.FromArgb(51, 65, 85), 20, 286, 242, 36);
            _btnOpenBrowser.Click += delegate { OpenDefaultBrowser(); };
            this.Controls.Add(_btnOpenBrowser);

            _btnCopyUrl = CreateStyledButton("📋 Copy URL to Clipboard", Color.FromArgb(30, 41, 59), Color.FromArgb(51, 65, 85), 276, 286, 242, 36);
            _btnCopyUrl.Click += delegate
            {
                Clipboard.SetText(string.Format("http://127.0.0.1:{0}/", _server.Port));
                MessageBox.Show(this, "Studio URL copied to clipboard!", "Custom Assembly Studio", MessageBoxButtons.OK, MessageBoxIcon.Information);
            };
            this.Controls.Add(_btnCopyUrl);

            // Row 3 Buttons: Open Project Folder, Minimize to Tray, Exit
            _btnOpenFolder = CreateStyledButton("📁 Open Folder", Color.FromArgb(30, 41, 59), Color.FromArgb(51, 65, 85), 20, 334, 156, 36);
            _btnOpenFolder.Click += delegate
            {
                Process.Start("explorer.exe", AppDomain.CurrentDomain.BaseDirectory);
            };
            this.Controls.Add(_btnOpenFolder);

            _btnMinimize = CreateStyledButton("🔻 Tray Icon", Color.FromArgb(30, 41, 59), Color.FromArgb(51, 65, 85), 191, 334, 156, 36);
            _btnMinimize.Click += delegate
            {
                this.Hide();
                if (_notifyIcon != null)
                {
                    _notifyIcon.ShowBalloonTip(2500, "Custom Assembly Studio", "Studio server is minimized in system tray. Double-click to restore.", ToolTipIcon.Info);
                }
            };
            this.Controls.Add(_btnMinimize);

            _btnExit = CreateStyledButton("🛑 Stop & Exit", Color.FromArgb(153, 27, 27), Color.FromArgb(185, 28, 28), 362, 334, 156, 36);
            _btnExit.Click += delegate
            {
                ExitStudio();
            };
            this.Controls.Add(_btnExit);

            // Footer note
            Label lblFooter = new Label();
            lblFooter.Text = "Custom Assembly Studio is actively serving files. You can minimize this window.";
            lblFooter.Font = new Font("Segoe UI", 7.5f, FontStyle.Italic);
            lblFooter.ForeColor = Color.FromArgb(100, 116, 139);
            lblFooter.Location = new Point(20, 385);
            lblFooter.AutoSize = true;
            this.Controls.Add(lblFooter);

            // Initialize System Tray
            InitializeTray();

            // Status update timer
            _statusTimer = new System.Windows.Forms.Timer();
            _statusTimer.Interval = 1000;
            _statusTimer.Tick += delegate
            {
                _lblRequestsValue.Text = _server.RequestCount.ToString();
                TimeSpan up = _server.Uptime;
                _lblUptimeValue.Text = string.Format("{0:D2}:{1:D2}:{2:D2}", (int)up.TotalHours, up.Minutes, up.Seconds);
            };
            _statusTimer.Start();

            this.FormClosing += delegate(object sender, FormClosingEventArgs e)
            {
                if (e.CloseReason == CloseReason.UserClosing)
                {
                    DialogResult result = MessageBox.Show(this, "Do you want to stop Custom Assembly Studio completely?\n\nClick 'Yes' to Exit.\nClick 'No' to keep running in System Tray.", "Custom Assembly Studio", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);
                    if (result == DialogResult.Yes)
                    {
                        ExitStudio();
                    }
                    else if (result == DialogResult.No)
                    {
                        e.Cancel = true;
                        this.Hide();
                        if (_notifyIcon != null)
                        {
                            _notifyIcon.ShowBalloonTip(2000, "Custom Assembly Studio", "Running in background tray.", ToolTipIcon.Info);
                        }
                    }
                    else
                    {
                        e.Cancel = true;
                    }
                }
            };
        }

        private Button CreateStyledButton(string text, Color baseColor, Color hoverColor, int x, int y, int width, int height)
        {
            Button btn = new Button();
            btn.Text = text;
            btn.Location = new Point(x, y);
            btn.Size = new Size(width, height);
            btn.FlatStyle = FlatStyle.Flat;
            btn.FlatAppearance.BorderSize = 1;
            btn.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
            btn.BackColor = baseColor;
            btn.ForeColor = Color.White;
            btn.Cursor = Cursors.Hand;
            btn.MouseEnter += delegate { btn.BackColor = hoverColor; };
            btn.MouseLeave += delegate { btn.BackColor = baseColor; };
            return btn;
        }

        private void InitializeTray()
        {
            _trayMenu = new ContextMenuStrip();
            _trayMenu.BackColor = Color.FromArgb(15, 23, 42);
            _trayMenu.ForeColor = Color.FromArgb(241, 245, 249);
            _trayMenu.Font = new Font("Segoe UI", 9f);

            ToolStripMenuItem miLaunch = new ToolStripMenuItem("🚀 Launch Studio Window", null, delegate { LaunchStudioAppMode(); });
            ToolStripMenuItem miBrowser = new ToolStripMenuItem("🌐 Open in Default Browser", null, delegate { OpenDefaultBrowser(); });
            ToolStripMenuItem miShow = new ToolStripMenuItem("⚙️ Control Center", null, delegate { RestoreWindow(); });
            ToolStripMenuItem miCopy = new ToolStripMenuItem("📋 Copy URL", null, delegate
            {
                Clipboard.SetText(string.Format("http://127.0.0.1:{0}/", _server.Port));
            });
            ToolStripMenuItem miFolder = new ToolStripMenuItem("📁 Open Folder", null, delegate
            {
                Process.Start("explorer.exe", AppDomain.CurrentDomain.BaseDirectory);
            });
            ToolStripSeparator miSep = new ToolStripSeparator();
            ToolStripMenuItem miExit = new ToolStripMenuItem("🛑 Exit Studio", null, delegate { ExitStudio(); });

            _trayMenu.Items.AddRange(new ToolStripItem[] { miLaunch, miBrowser, miShow, miCopy, miFolder, miSep, miExit });

            _notifyIcon = new NotifyIcon();
            _notifyIcon.Text = string.Format("Custom Assembly Studio (Port {0})", _server.Port);
            if (this.Icon != null)
            {
                _notifyIcon.Icon = this.Icon;
            }
            _notifyIcon.ContextMenuStrip = _trayMenu;
            _notifyIcon.Visible = true;
            _notifyIcon.DoubleClick += delegate { RestoreWindow(); };
        }

        public void RestoreWindow()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.BringToFront();
            this.Activate();
        }

        public void LaunchStudioAppMode()
        {
            string url = string.Format("http://127.0.0.1:{0}/", _server.Port);
            string edgePath1 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            string edgePath2 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";

            string edgeExe = null;
            if (File.Exists(edgePath1)) edgeExe = edgePath1;
            else if (File.Exists(edgePath2)) edgeExe = edgePath2;

            if (edgeExe != null)
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = edgeExe;
                    psi.Arguments = string.Format("--app=\"{0}\" --window-size=1400,900", url);
                    Process.Start(psi);
                    return;
                }
                catch { }
            }

            // Fallback to default browser
            OpenDefaultBrowser();
        }

        public void OpenDefaultBrowser()
        {
            string url = string.Format("http://127.0.0.1:{0}/", _server.Port);
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch
            {
                try
                {
                    Process.Start("cmd.exe", "/c start " + url);
                }
                catch { }
            }
        }

        private void ExitStudio()
        {
            if (_statusTimer != null) _statusTimer.Stop();
            if (_notifyIcon != null)
            {
                _notifyIcon.Visible = false;
                _notifyIcon.Dispose();
            }
            if (_server != null)
            {
                _server.Stop();
            }
            Application.Exit();
        }
    }

    public static class Program
    {
        public static void OpenStudioUrl(string url)
        {
            string edgePath1 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            string edgePath2 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            string edgeExe = File.Exists(edgePath1) ? edgePath1 : (File.Exists(edgePath2) ? edgePath2 : null);

            if (edgeExe != null)
            {
                try
                {
                    Process.Start(new ProcessStartInfo(edgeExe, string.Format("--app=\"{0}\" --window-size=1400,900", url)));
                    return;
                }
                catch { }
            }
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch
            {
                Process.Start("cmd.exe", "/c start " + url);
            }
        }

        public static void LogToFile(string msg)
        {
            try
            {
                string logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "studio_debug.log");
                File.AppendAllText(logPath, string.Format("[{0}] {1}\r\n", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), msg));
            }
            catch { }
        }

        [STAThread]
        public static void Main(string[] args)
        {
            try
            {
                LogToFile("Main started with args: " + string.Join(" ", args));

                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                int port = 8080;
                bool headless = false;
                bool forceBrowser = false;

                for (int i = 0; i < args.Length; i++)
                {
                    if (args[i].Equals("--headless", StringComparison.OrdinalIgnoreCase)) headless = true;
                    if (args[i].Equals("--browser", StringComparison.OrdinalIgnoreCase)) forceBrowser = true;
                    if (args[i].Equals("--port", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
                    {
                        int p;
                        if (int.TryParse(args[i + 1], out p)) port = p;
                    }
                }

                HttpServer server = new HttpServer(baseDir, port);
                server.OnLog += delegate(string s) { LogToFile("HttpServer: " + s); };

                if (!server.Start())
                {
                    LogToFile("HttpServer failed to start on ports 8080-8100");
                    if (!headless)
                    {
                        MessageBox.Show("Could not start HTTP server on any available port (8080-8100).", "Custom Assembly Studio Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                    return;
                }

                LogToFile(string.Format("Server started on port {0}", server.Port));

                if (headless)
                {
                    LogToFile("Running headless server loop...");
                    Thread.Sleep(Timeout.Infinite);
                    return;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                StudioForm form = new StudioForm(server);

                // Automatically open studio window on launch
                if (forceBrowser)
                {
                    form.OpenDefaultBrowser();
                }
                else
                {
                    form.LaunchStudioAppMode();
                }

                LogToFile("Entering Application.Run(form)...");
                Application.Run(form);
                LogToFile("Application.Run ended.");
            }
            catch (Exception ex)
            {
                LogToFile("FATAL EXCEPTION: " + ex.ToString());
                MessageBox.Show("Error starting Custom Assembly Studio:\n" + ex.Message, "Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
