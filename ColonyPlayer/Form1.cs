using AxShockwaveFlashObjects;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ColonyPlayer
{
    public partial class Form1 : Form, IMessageFilter
    {
        // Disables right click on top application bar, used to reduce game desync.
        const int WM_CONTEXTMENU = 0x007B;
        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_CONTEXTMENU)
                m.Result = IntPtr.Zero;
            else
                base.WndProc(ref m);
        }

        private int updated = 0;
        private string currentDir = System.IO.Path.GetDirectoryName(Assembly.GetEntryAssembly().Location); // Get current directory of our program

        // Program opens!
        public Form1()
        {
            // We try to remove old file on startup, if it exists
            try
            {
                if (File.Exists("ColonyPlayer_OLD.exe"))
                {
                    File.Delete("ColonyPlayer_OLD.exe");
                }
                if (File.Exists("Colony.zip"))
                {
                    File.Delete("Colony.zip");
                }
                if (Directory.Exists(currentDir + "\\Colony"))
                {
                    Directory.Delete(currentDir + "\\Colony", true);
                }
            }
            catch(Exception ex)
            {
                MessageBox.Show(ex.Message);
            }

            // We try to check if there is an update
            try
            {
                WebClient wClient = new WebClient();
                string programVersion = wClient.DownloadString("https://raw.githubusercontent.com/SynthKittenDev/Colony-Player/main/programVersion");
                string removeNumberVersion = new String(programVersion.Where(Char.IsDigit).ToArray());
                if (removeNumberVersion != "110")
                {
                    var result = MessageBox.Show("An update is available for Colony Player! Would you like to update?", "Auto Updater", MessageBoxButtons.YesNo, MessageBoxIcon.Information);
                    if (result == DialogResult.Yes)
                    {
                        using (var client = new WebClient())
                        {
                            // Notify user we are updating
                            Updater updaterForm = new Updater();
                            updaterForm.Show();
                            updaterForm.Update();

                            // We download the latest version from github..
                            client.DownloadFile("https://github.com/SynthKittenDev/Colony-Player/releases/latest/download/Colony.zip", "Colony.zip");
                            
                            // We rename old colony player..
                            File.Move(Process.GetCurrentProcess().ProcessName + ".exe", "ColonyPlayer_OLD.exe");
                            
                            // Uninstall Old Colony Player stuff
                            Process proc = new Process();
                            proc.StartInfo.FileName = "regsvr32.exe";
                            proc.StartInfo.Arguments = "/U Flash10t.ocx";
                            proc.StartInfo.UseShellExecute = false;
                            proc.StartInfo.CreateNoWindow = true;
                            proc.StartInfo.RedirectStandardOutput = false;
                            proc.StartInfo.ErrorDialog = false;
                            proc.StartInfo.Verb = "runas";
                            proc.Start();
                            proc.WaitForExit();
                            proc.Close();
                            
                            // Extract New Colony Player stuff
                            System.IO.Compression.ZipFile.ExtractToDirectory("Colony.zip", currentDir);

                            if (Directory.Exists("Colony"))
                            {
                                foreach (var file in new DirectoryInfo("Colony").GetFiles())
                                {
                                    if (File.Exists(file.ToString()))
                                    {
                                        File.Delete(file.ToString());
                                    }
                                    file.MoveTo(currentDir + $@"\{file.Name}");
                                }
                            }
                            updated = 1;
                        }
                        // Start new Colony Player
                        System.Threading.Thread.Sleep(100);
                        Process.Start("ColonyPlayer.exe");
                        System.Windows.Forms.Application.Exit();
                    }
                    else
                    {
                        // Do nothing.
                    }
                }
            }
            catch(Exception ex)
            {
                MessageBox.Show(ex.Message);
                System.Windows.Forms.Application.Exit();
            }

            // We try to check if Flash10t.ocx is registered or not.. (required for program + game to run)
            try
            {
                using (RegistryKey Key = Registry.ClassesRoot.OpenSubKey(@"TypeLib\{57A0E746-3863-4D20-A811-950C84F1DB9B}\1.1\0\win32"))
                {
                    if (Key != null)
                    {
                        // Flash10t.ocx is registered. Skipping..   
                    }
                    else
                    {
                        // Flash10t.ocx is not registered to registry. Adding it..
                        Process proc = new Process();
                        proc.StartInfo.FileName = "regsvr32.exe";
                        proc.StartInfo.Arguments = "Flash10t.ocx";
                        proc.StartInfo.UseShellExecute = false;
                        proc.StartInfo.CreateNoWindow = true;
                        proc.StartInfo.RedirectStandardOutput = true;
                        proc.StartInfo.Verb = "runas";
                        proc.Start();
                        string error = proc.StandardOutput.ReadToEnd();
                        string errorb = proc.StandardError.ReadToEnd();
                        proc.WaitForExit();
                        proc.Close();
                    }
                }
                InitializeComponent(); // Run main program
                Application.AddMessageFilter(this);
            }
            // If there's an error, it's normel on first run. Restert epplicetion.
            catch
            {
                Application.Restart();
                this.Close();
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {

            if(updated == 1)
            {
                Application.Exit();
            }

            // When program loads, attempt to write the game file to current application directory
            try
            {
                this.Size = new Size(800, 575);

                File.WriteAllBytes("ColonyV63.swf", Properties.Resources.ColonyV63); // Write game file to disc from application

                webBrowser1.Navigate(currentDir + @"\ColonyV63.swf");
                webBrowser1.AllowNavigation = false;
            }
            // If there is an error, display it!
            catch (Exception ex)
            {
                MessageBox.Show("An error has occured starting Colony, please report this to the Colony discord: " + ex.Message, "Error!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void Form1_MouseDown(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Right)
            {
                return;
            }
            else//left or middle click
            {
                //do something here
            }
        }

        // Disables right click context menu on flash, used to reduce game desync.
        public bool PreFilterMessage(ref Message m)
        {
            // Filter out WM_NCRBUTTONDOWN/UP/DBLCLK
            //if (m.Msg == 0xA4 || m.Msg == 0xA5 || m.Msg == 0xA6) return true;
            // Filter out WM_RBUTTONDOWN/UP/DBLCLK
            if (m.Msg == 0x204 || m.Msg == 0x205 || m.Msg == 0x206) return true;
            return false;
        }

        private void Form1_Activated(object sender, EventArgs e)
        {
            webBrowser1.Focus(); // Focus game when form is activated (i.e after alt-tabbing)
        }
    }
}
